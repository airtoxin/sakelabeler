import { test as base, expect, type Page } from '@playwright/test';
import { mockSupabase } from './supabase-mock.mjs';

type RecordRow = { id: string; name: string; brewery: string; rating: number; restaurant: string; memo: string; created_at: Date };
type PhotoRow = { id: string; storage_path: string; is_cover: boolean };

const test = base.extend<{ backend: Awaited<ReturnType<typeof mockSupabase>> }>({
  backend: async ({ context }, runTest) => {
    const backend = await mockSupabase(context);
    const errors: string[] = [];
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    for (const page of context.pages()) page.on('pageerror', error => errors.push(error.message));
    try {
      await runTest(backend);
      expect(backend.unexpected).toEqual([]);
      expect(errors).toEqual([]);
    } finally { await backend.close(); }
  },
});

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill('test@example.invalid');
  await page.getByLabel('パスワード').fill('isolated-test-password');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4318/');
}
async function imageFile(page: Page, color: string, name: string) {
  const image = await page.evaluate(color => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 900;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color; ctx.fillRect(0, 0, 1200, 900);
    return canvas.toDataURL('image/png').split(',')[1];
  }, color);
  return { name, mimeType: 'image/png', buffer: Buffer.from(image, 'base64') };
}
async function addPhotos(page: Page) {
  const first = await imageFile(page, '#a21caf', 'first.png');
  const second = await imageFile(page, '#0284c7', 'second.png');
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'ライブラリから選択', exact: true }).tap();
  await (await chooser).setFiles([first, second]);
  await expect(page.getByRole('button', { name: '写真 2をカバーに設定', exact: true })).toBeEnabled();
  return { first, second };
}
async function edit(page: Page) {
  await page.getByRole('button', { name: '編集する', exact: true }).tap();
  await expect(page.getByLabel('醸造所')).toBeVisible();
}
async function update(page: Page, name: string) {
  await page.getByRole('button', { name: '更新する', exact: true }).tap();
  await expect(page.getByRole('heading', { name, level: 2, exact: true })).toBeVisible();
}
const cover = (page: Page, n: number) => page.getByRole('button', { name: `写真 ${n}をカバーに設定`, exact: true });

test('touch cover selection and brewery persist through Supabase SDK writes, detail/list reload and cancel', async ({ page, backend }, testInfo) => {
  await login(page);
  await page.goto('/new');
  await page.getByLabel('お酒の名前').fill('検証用のお酒');
  await page.getByLabel('醸造所').fill('  自由な醸造所 A & B  ');
  await page.getByLabel('お店の名前').fill('残す店舗');
  await page.getByLabel('メモ').fill('残すメモ');
  await addPhotos(page);
  await expect(page.getByLabel('カメラで写真を追加')).toHaveAttribute('capture', 'environment');
  await expect(page.getByLabel('ライブラリから写真を追加')).not.toHaveAttribute('capture');
  await expect(cover(page, 2)).toHaveCSS('opacity', '1');
  expect((await cover(page, 2).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await cover(page, 2).tap();
  await expect(cover(page, 2)).toHaveAttribute('aria-pressed', 'true');
  await expect(cover(page, 1)).toHaveAttribute('aria-pressed', 'false');
  await page.screenshot({ path: testInfo.outputPath('new-mobile.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: '保存する', exact: true }).tap();
  await expect(page).toHaveURL('http://127.0.0.1:4318/');
  await expect(page.getByText('醸造所：自由な醸造所 A & B', { exact: true })).toBeVisible();
  const { rows: [record] } = await backend.db.query<RecordRow>('SELECT * FROM sake_records');
  expect(record.brewery).toBe('自由な醸造所 A & B');
  expect(record.rating).toBe(0);
  let photos = (await backend.db.query<PhotoRow>('SELECT * FROM sake_photos ORDER BY sort_order')).rows;
  expect(photos.map(photo => photo.is_cover)).toEqual([false, true]);
  expect(backend.blobs.size).toBe(2);
  await expect(page.getByAltText('検証用のお酒', { exact: true })).toHaveAttribute('src', new RegExp(photos[1].storage_path));
  await page.getByRole('link').filter({ hasText: '検証用のお酒' }).tap();
  await expect(page.getByRole('region', { name: '写真', exact: true })).toContainText('2 / 2');
  await page.reload();
  await expect(page.getByRole('region', { name: '写真', exact: true })).toContainText('2 / 2');
  await expect(page.getByText('自由な醸造所 A & B', { exact: true })).toBeVisible();
  await edit(page);
  await expect(page.getByLabel('醸造所')).toHaveValue('自由な醸造所 A & B');
  await expect(cover(page, 2)).toHaveAttribute('aria-pressed', 'true');
  await cover(page, 1).tap();
  await page.getByLabel('醸造所').fill('編集した醸造所');
  await page.screenshot({ path: testInfo.outputPath('edit-mobile.png'), fullPage: true, animations: 'disabled' });
  await update(page, '検証用のお酒');
  await expect(page.getByRole('region', { name: '写真', exact: true })).toContainText('1 / 2');
  await page.reload();
  await expect(page.getByText('編集した醸造所', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: '写真', exact: true })).toContainText('1 / 2');
  await page.screenshot({ path: testInfo.outputPath('detail-mobile.png'), fullPage: true, animations: 'disabled' });
  const updated = (await backend.db.query<RecordRow>('SELECT * FROM sake_records WHERE id=$1', [record.id])).rows[0];
  expect(updated.restaurant).toBe('残す店舗');
  expect(updated.memo).toBe('残すメモ');
  expect(updated.created_at).toEqual(record.created_at);
  photos = (await backend.db.query<PhotoRow>('SELECT * FROM sake_photos ORDER BY sort_order')).rows;
  expect(photos.map(photo => photo.is_cover)).toEqual([true, false]);
  expect(backend.requests.filter(r => r.method === 'POST' && r.endpoint.startsWith('/storage/')).length).toBe(2);
  await edit(page);
  await cover(page, 2).tap();
  await page.getByLabel('醸造所').fill('取消する変更');
  await page.getByRole('button', { name: 'キャンセル', exact: true }).tap();
  await expect(page.getByText('編集した醸造所', { exact: true })).toBeVisible();
  await page.goto('/');
  await expect(page.getByText('醸造所：編集した醸造所', { exact: true })).toBeVisible();
  await expect(page.getByAltText('検証用のお酒', { exact: true })).toHaveAttribute('src', new RegExp(photos[0].storage_path));
  await page.screenshot({ path: testInfo.outputPath('list-mobile.png'), fullPage: true, animations: 'disabled' });
});

test('old records, brewery-only input, optional clear and DB copy keep brewery and cover', async ({ page, backend }) => {
  const { rows: [old] } = await backend.db.query<RecordRow>("INSERT INTO sake_records(user_id,name,memo) VALUES ($1,'旧記録','旧メモ') RETURNING *", [backend.OWNER]);
  await backend.db.query<RecordRow>('INSERT INTO db_shares(owner_id,invitee_id) VALUES ($1,$2)', [backend.SHARED, backend.OWNER]);
  await login(page);
  await page.goto(`/${old.id}`);
  await expect(page.getByRole('heading', { name: '旧記録', level: 2 })).toBeVisible();
  await expect(page.getByText('醸造所', { exact: true })).toHaveCount(0);
  await edit(page);
  await expect(page.getByLabel('醸造所')).toHaveValue('');
  await page.getByLabel('醸造所').fill('後から登録した蔵');
  await addPhotos(page);
  await cover(page, 2).tap();
  await update(page, '旧記録');
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: /のDB（共有元）にコピー/ }).tap();
  await expect.poll(async () => (await backend.db.query<RecordRow>('SELECT * FROM sake_records WHERE user_id=$1', [backend.SHARED])).rows.length).toBe(1);
  const copy = (await backend.db.query<RecordRow>('SELECT * FROM sake_records WHERE user_id=$1', [backend.SHARED])).rows[0];
  expect(copy.brewery).toBe('後から登録した蔵');
  expect(copy.memo).toBe('旧メモ');
  await expect.poll(async () => (await backend.db.query<PhotoRow>('SELECT * FROM sake_photos WHERE record_id=$1', [copy.id])).rows.length).toBe(2);
  const copiedPhotos = (await backend.db.query<PhotoRow>('SELECT * FROM sake_photos WHERE record_id=$1 ORDER BY sort_order', [copy.id])).rows;
  expect(copiedPhotos.map(photo => photo.is_cover)).toEqual([false, true]);
  await edit(page);
  await page.getByLabel('醸造所').fill('   ');
  await update(page, '旧記録');
  await page.reload();
  await expect(page.getByRole('heading', { name: '旧記録', level: 2 })).toBeVisible();
  await expect(page.getByText('醸造所', { exact: true })).toHaveCount(0);
  expect((await backend.db.query<RecordRow>('SELECT brewery FROM sake_records WHERE id=$1', [old.id])).rows[0].brewery).toBe('');
  await page.goto('/new');
  await page.getByLabel('醸造所').fill('蔵だけの記録');
  await page.getByRole('button', { name: '保存する', exact: true }).tap();
  await expect(page.getByText('醸造所：蔵だけの記録', { exact: true })).toBeVisible();
  const breweryOnly = (await backend.db.query<RecordRow>("SELECT * FROM sake_records WHERE brewery='蔵だけの記録'")).rows[0];
  expect(breweryOnly.name).toBe('');
  expect(breweryOnly.rating).toBe(0);
});

test('brewery and other fields can stay blank while the existing empty-record guard remains', async ({ page, backend }) => {
  await login(page);
  await page.goto('/new');
  await expect(page.getByLabel('醸造所', { exact: true })).toHaveValue('');
  await expect(page.locator('form [required]')).toHaveCount(0);
  await page.getByLabel('日付', { exact: true }).fill('');
  const save = page.getByRole('button', { name: '保存する', exact: true });
  await expect(save).toBeDisabled();
  await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit());
  expect((await backend.db.query('SELECT id FROM sake_records')).rows).toEqual([]);

  await page.getByLabel('メモ', { exact: true }).fill('メモだけの記録');
  await expect(save).toBeEnabled();
  await save.tap();
  await expect(page).toHaveURL('http://127.0.0.1:4318/');
  const { rows: [record] } = await backend.db.query<RecordRow>('SELECT * FROM sake_records');
  expect(record).toMatchObject({
    name: '', brewery: '', restaurant: '', origin: '', date: '',
    alcohol_type: '', tags: [], rating: 0, memo: 'メモだけの記録',
    location_lat: null, location_lng: null,
  });
  expect((await backend.db.query('SELECT id FROM sake_photos')).rows).toEqual([]);
  await page.goto(`/${record.id}`);
  await page.reload();
  await edit(page);
  await expect(page.getByLabel('醸造所', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('お酒の名前', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('日付', { exact: true })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'メモ', exact: true })).toHaveValue('メモだけの記録');
});

test('cover errors remain visible, photo loading blocks save, and replacement/removal persist', async ({ page, backend }) => {
  await login(page);
  await page.goto('/new');
  await page.getByLabel('お酒の名前').fill('写真の検証');
  const { first } = await addPhotos(page);
  await page.getByRole('button', { name: '保存する', exact: true }).tap();
  await page.getByRole('link').filter({ hasText: '写真の検証' }).tap();
  const original = (await backend.db.query<PhotoRow>('SELECT * FROM sake_photos ORDER BY sort_order')).rows;
  await edit(page);
  const input = page.getByLabel('ライブラリから写真を追加');
  await input.setInputFiles({ name: 'bad.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('bad image') });
  await expect(page.getByRole('alert').filter({ hasText: '写真を読み込めません' })).toBeVisible();
  await expect(cover(page, 1)).toHaveAttribute('aria-pressed', 'true');
  expect((await backend.db.query<PhotoRow>('SELECT * FROM sake_photos')).rows.length).toBe(2);
  await input.setInputFiles([]);
  await page.evaluate(() => {
    const originalRead = FileReader.prototype.readAsDataURL;
    FileReader.prototype.readAsDataURL = function(file) {
      FileReader.prototype.readAsDataURL = originalRead;
      setTimeout(() => originalRead.call(this, file), 750);
    };
  });
  await input.setInputFiles(first);
  await expect(page.getByRole('button', { name: '写真を読み込み中...', exact: true })).toBeDisabled();
  await expect(cover(page, 1)).toBeDisabled();
  await page.locator('form').evaluate(form => (form as HTMLFormElement).requestSubmit());
  expect((await backend.db.query<PhotoRow>('SELECT * FROM sake_photos')).rows.length).toBe(2);
  await expect(cover(page, 3)).toBeEnabled();
  await expect(input).toHaveValue('');
  await cover(page, 3).tap();
  backend.failNext('PATCH', '/rest/v1/sake_photos');
  await page.getByRole('button', { name: '更新する', exact: true }).tap();
  await expect(page.getByRole('alert').filter({ hasText: '保存できませんでした' })).toBeVisible();
  await expect(cover(page, 3)).toHaveAttribute('aria-pressed', 'true');
  expect((await backend.db.query<PhotoRow>('SELECT * FROM sake_photos ORDER BY sort_order')).rows).toEqual(original);
  await update(page, '写真の検証');
  await page.reload();
  await expect(page.getByRole('region', { name: '写真', exact: true })).toContainText('3 / 3');
  const saved = (await backend.db.query<PhotoRow>('SELECT * FROM sake_photos ORDER BY sort_order')).rows;
  expect(saved.map(photo => photo.is_cover)).toEqual([false, false, true]);
  await edit(page);
  await page.getByRole('button', { name: '写真を削除', exact: true }).nth(2).tap();
  await expect(cover(page, 1)).toHaveAttribute('aria-pressed', 'true');
  await update(page, '写真の検証');
  await page.reload();
  await expect(page.getByRole('region', { name: '写真', exact: true })).toContainText('1 / 2');
  expect((await backend.db.query<PhotoRow>('SELECT * FROM sake_photos ORDER BY sort_order')).rows.map(photo => photo.is_cover)).toEqual([true, false]);
  expect(backend.blobs.size).toBe(2);
});
