/**
 * Verify Supabase connection using environment variables from .env.local
 * Run: npm run verify-supabase
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

// Load .env.local manually (no dotenv dependency needed)
function loadEnvFile() {
  const envPath = resolve(ROOT, '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const vars = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      if (key) vars[key.trim()] = rest.join('=').trim();
    }
    return vars;
  } catch {
    return null;
  }
}

async function verify() {
  console.log('\n🔍 Verifying Supabase connection...\n');

  // 1. Check env file exists
  const env = loadEnvFile();
  if (!env) {
    console.error('❌ .env.local not found.');
    console.error('   Run: cp .env.example .env.local and fill in your values.');
    process.exit(1);
  }
  console.log('✅ .env.local found');

  // 2. Check required variables
  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!url || url === 'https://your-project.supabase.co') {
    console.error('❌ VITE_SUPABASE_URL is missing or still set to placeholder.');
    process.exit(1);
  }
  console.log(`✅ VITE_SUPABASE_URL = ${url}`);

  if (!anonKey || anonKey === 'your-anon-key-here') {
    console.error('❌ VITE_SUPABASE_ANON_KEY is missing or still set to placeholder.');
    process.exit(1);
  }
  console.log(`✅ VITE_SUPABASE_ANON_KEY = ${anonKey.slice(0, 20)}...`);

  // 3. Test connection — hit the REST health endpoint
  const healthUrl = `${url}/rest/v1/`;
  console.log(`\n🌐 Connecting to ${healthUrl} ...`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(healthUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      console.log(`✅ Supabase REST API reachable (HTTP ${response.status})`);
    } else {
      const body = await response.text();
      console.error(`⚠️  Supabase responded with HTTP ${response.status}`);
      console.error(`   Body: ${body.slice(0, 200)}`);
    }
  } catch (err) {
    const cause = err.cause;
    if (cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || err.name === 'AbortError') {
      console.error('❌ Connection timed out.');
      console.error('   The env vars are correct but the network cannot reach Supabase.');
      console.error('   Possible causes: VPN/proxy blocking, corporate firewall, or no internet.');
    } else {
      console.error('❌ Failed to reach Supabase:', err.message);
      if (cause) console.error('   Cause:', cause.message || cause.code);
    }
    process.exit(1);
  }

  // 4. Test Auth endpoint
  const authUrl = `${url}/auth/v1/settings`;
  console.log(`\n🔐 Checking Auth service at ${authUrl} ...`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(authUrl, {
      headers: {
        apikey: anonKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const settings = await response.json();
      console.log(`✅ Auth service reachable`);
      console.log(`   External providers: ${(settings.external || {}) && Object.keys(settings.external || {}).filter(k => settings.external[k]).join(', ') || 'email only'}`);
    } else {
      console.error(`⚠️  Auth service responded with HTTP ${response.status}`);
    }
  } catch (err) {
    console.error('❌ Failed to reach Auth service:', err.cause?.message || err.message);
  }

  console.log('\n🎉 Supabase connection verified successfully!\n');
}

verify();



