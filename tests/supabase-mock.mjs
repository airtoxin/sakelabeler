import { createDatabase, asUser, OWNER, SHARED } from './database.mjs';

async function mockSupabase(context) {
  const db = await createDatabase();
  const blobs = new Map();
  const requests = [];
  const unexpected = [];
  let failure = null;
  const user = { id: OWNER, email: 'test@example.invalid', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
  const token = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: OWNER, exp: Math.floor(Date.now() / 1000) + 36000 })).toString('base64url'), 'test-signature'].join('.');
  const session = { access_token: token, refresh_token: 'isolated-refresh', token_type: 'bearer', expires_in: 36000, expires_at: Math.floor(Date.now() / 1000) + 36000, user };
  const columns = new Map();
  for (const table of ['sake_records', 'sake_photos', 'db_shares']) {
    const result = await db.query('SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2', ['public', table]);
    columns.set(table, new Set(result.rows.map(row => row.column_name)));
  }
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === 'http://127.0.0.1:4318') return route.continue();
    if (url.origin !== 'http://127.0.0.1:54329') {
      unexpected.push(request.url());
      return route.abort();
    }
    const method = request.method();
    const endpoint = url.pathname;
    requests.push({ method, endpoint });
    if (failure && failure.method === method && failure.endpoint === endpoint) {
      failure = null;
      return json(route, { code: 'TEST_FAILURE', message: 'Injected test failure' }, 500);
    }
    if (endpoint === '/auth/v1/token') return json(route, session);
    if (endpoint === '/auth/v1/user') return json(route, user);
    if (endpoint === '/auth/v1/logout') return json(route, {});

    try {
      if (endpoint.startsWith('/storage/v1/object/public/sake-photos/')) {
        const key = decodeURIComponent(endpoint.split('/sake-photos/')[1]);
        const blob = blobs.get(key);
        if (!blob) throw new Error('Unknown test image: ' + key);
        return route.fulfill({ contentType: 'image/jpeg', body: blob });
      }
      if (endpoint.startsWith('/storage/v1/object/sake-photos/')) {
        const key = decodeURIComponent(endpoint.split('/sake-photos/')[1]);
        const contentType = request.headers()['content-type'];
        const body = request.postDataBuffer();
        const form = await new Response(body, { headers: { 'Content-Type': contentType } }).formData();
        const file = [...form.values()].find(value => typeof value !== 'string');
        if (!file) throw new Error('Missing upload file');
        blobs.set(key, Buffer.from(await file.arrayBuffer()));
        return json(route, { Key: 'sake-photos/' + key, Id: crypto.randomUUID() });
      }
      if (endpoint === '/storage/v1/object/sake-photos' && method === 'DELETE') {
        const { prefixes } = request.postDataJSON();
        for (const prefix of prefixes) blobs.delete(prefix);
        return json(route, prefixes.map(name => ({ name })));
      }
      const table = endpoint.split('/rest/v1/')[1];
      const allowed = columns.get(table);
      if (!allowed) throw new Error(`Unexpected endpoint: ${endpoint}`);
      const identifier = value => {
        if (!allowed.has(value)) throw new Error(`Unknown column: ${value}`);
        return '"' + value + '"';
      };
      const params = [];
      const where = [];
      for (const [key, value] of url.searchParams) {
        if (['select', 'order'].includes(key)) continue;
        const col = identifier(key);
        if (value.startsWith('eq.')) { params.push(value.slice(3)); where.push(`${col}=$${params.length}`); }
        else if (value.startsWith('in.(')) {
          const values = value.slice(4, -1).split(',').map(v => v.replace(/^"|"$/g, ''));
          const indexes = values.map(v => { params.push(v); return '$' + params.length; });
          where.push(`${col} IN (${indexes.join(',')})`);
        } else throw new Error('Unsupported test filter: ' + value);
      }
      const clause = where.length ? ' WHERE ' + where.join(' AND ') : '';
      let sql;
      if (method === 'GET') {
        const selected = url.searchParams.get('select') || '*';
        const projection = selected === '*' ? '*' : selected.split(',').map(identifier).join(',');
        sql = `SELECT ${projection} FROM "${table}"${clause}`;
        const order = url.searchParams.get('order');
        if (order) {
          const [field, direction] = order.split('.');
          sql += ` ORDER BY ${identifier(field)} ${direction === 'desc' ? 'DESC' : 'ASC'}`;
        }
      } else if (method === 'POST') {
        const data = request.postDataJSON();
        const fields = Object.keys(data);
        const names = fields.map(identifier);
        const indexes = fields.map(key => { params.push(data[key]); return '$' + params.length; });
        sql = `INSERT INTO "${table}" (${names.join(',')}) VALUES (${indexes.join(',')}) RETURNING *`;
      } else if (method === 'PATCH') {
        const data = request.postDataJSON();
        const updates = Object.keys(data).map(key => { params.push(data[key]); return `${identifier(key)}=$${params.length}`; });
        sql = `UPDATE "${table}" SET ${updates.join(',')}${clause} RETURNING *`;
      } else if (method === 'DELETE') sql = `DELETE FROM "${table}"${clause} RETURNING *`;
      else throw new Error('Unsupported method: ' + method);
      const { rows } = await asUser(db, OWNER, tx => tx.query(sql, params));
      if (request.headers().accept?.includes('vnd.pgrst.object+json')) {
        return rows.length === 1 ? json(route, rows[0]) : json(route, { message: 'Expected one row' }, 406);
      }
      return json(route, rows);
    } catch (error) {
      unexpected.push(error.message);
      return json(route, { message: error.message }, 500);
    }
  });
  return {
    db, requests, unexpected, blobs, OWNER, SHARED,
    failNext(method, endpoint) { failure = { method, endpoint }; },
    async close() { await context.unrouteAll({ behavior: 'wait' }); await db.close(); },
  };
}

export { mockSupabase };
