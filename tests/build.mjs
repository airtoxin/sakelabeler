import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// These deliberately non-production settings are baked into this test build.
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)), 'build'], {
  stdio: 'inherit', windowsHide: true,
  env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54329', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'isolated-test-key' },
});
process.exit(result.status ?? 1);
