import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabase, asUser, OWNER, SHARED, OUTSIDER, breweryMigration, migrations } from './database.mjs';

test('brewery migration preserves old rows/defaults and existing RLS access', async () => {
  const db = await createDatabase({ migrateBrewery: false });
  try {
    const { rows: [old] } = await asUser(db, OWNER, tx => tx.query(
      "INSERT INTO sake_records(user_id, name, memo) VALUES ($1, '旧記録', '残すメモ') RETURNING *", [OWNER]
    ));
    const beforePolicies = await db.query('SELECT * FROM pg_policies ORDER BY schemaname, tablename, policyname');
    await db.exec(fs.readFileSync(path.join(migrations, breweryMigration), 'utf8'));
    const { rows: [migrated] } = await db.query('SELECT * FROM sake_records WHERE id = $1', [old.id]);
    assert.deepEqual(migrated, { ...old, brewery: '' });
    const afterPolicies = await db.query('SELECT * FROM pg_policies ORDER BY schemaname, tablename, policyname');
    assert.deepEqual(afterPolicies.rows, beforePolicies.rows);
    const { rows: [column] } = await db.query("SELECT is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='sake_records' AND column_name='brewery'");
    assert.equal(column.is_nullable, 'NO');
    assert.equal(column.column_default, "''::text");

    const { rows: [legacyInsert] } = await asUser(db, OWNER, tx => tx.query('INSERT INTO sake_records(user_id) VALUES ($1) RETURNING brewery', [OWNER]));
    assert.equal(legacyInsert.brewery, '');
    await asUser(db, OWNER, tx => tx.query('UPDATE sake_records SET brewery=$1 WHERE id=$2', ['蔵 A & B', old.id]));
    assert.equal((await asUser(db, OWNER, tx => tx.query('SELECT brewery FROM sake_records WHERE id=$1', [old.id]))).rows[0].brewery, '蔵 A & B');
    assert.equal((await asUser(db, OUTSIDER, tx => tx.query('SELECT * FROM sake_records'))).rows.length, 0);
    assert.equal((await asUser(db, OUTSIDER, tx => tx.query("UPDATE sake_records SET brewery='不正' WHERE id=$1 RETURNING id", [old.id]))).rows.length, 0);
    await assert.rejects(asUser(db, OUTSIDER, tx => tx.query("INSERT INTO sake_records(user_id, brewery) VALUES ($1,'不正')", [OWNER])), /row-level security/);

    await db.query('INSERT INTO db_shares(owner_id,invitee_id) VALUES ($1,$2)', [OWNER, SHARED]);
    await asUser(db, SHARED, tx => tx.query("UPDATE sake_records SET brewery='共有で編集' WHERE id=$1", [old.id]));
    assert.equal((await asUser(db, OWNER, tx => tx.query('SELECT brewery FROM sake_records WHERE id=$1', [old.id]))).rows[0].brewery, '共有で編集');
    await asUser(db, OWNER, tx => tx.query("UPDATE sake_records SET brewery='' WHERE id=$1", [old.id]));
    assert.equal((await db.query('SELECT brewery FROM sake_records WHERE id=$1', [old.id])).rows[0].brewery, '');
    console.log('SQL: legacy rows/defaults, Japanese text, clear, owner/shared access, outsider denial, unchanged policies verified');
  } finally { await db.close(); }
});
