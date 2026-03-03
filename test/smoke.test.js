/**
 * Smoke-тесты: проверяют базовую доступность эндпоинтов
 * Запуск: node test/smoke.test.js (сервер должен быть запущен на порту 3000)
 */

const http = require('http');

let passed = 0;
let failed = 0;
const results = [];

function req(method, path, expectedStatus, body, headers) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    r.on('error', (e) => resolve({ status: 0, error: e.message }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function assert(name, condition, detail) {
  if (condition) {
    passed++;
    results.push({ ok: true, name });
    console.log(`  ✅ PASS  ${name}`);
  } else {
    failed++;
    results.push({ ok: false, name, detail });
    console.log(`  ❌ FAIL  ${name}  (${detail})`);
  }
}

async function run() {
  console.log('\n🚀 Car Service — Smoke Tests\n');

  // ── Главная страница ──
  console.log('[ Страницы ]');
  let r = await req('GET', '/');
  assert('GET / → 200', r.status === 200, `got ${r.status}`);
  assert('GET / → содержит Car Service', r.body.includes('Car Service'), 'не найдено');

  // ── Авторизация ──
  console.log('\n[ Авторизация ]');
  r = await req('GET', '/auth/login');
  assert('GET /auth/login → 200', r.status === 200, `got ${r.status}`);

  r = await req('GET', '/auth/reg');
  assert('GET /auth/reg → 200', r.status === 200, `got ${r.status}`);

  r = await req('GET', '/auth/logout');
  assert('GET /auth/logout → 302', r.status === 302, `got ${r.status}`);

  // ── Чат (без сессии — должен вернуть 401) ──
  console.log('\n[ Chat API — без авторизации ]');
  r = await req('GET', '/chat/messages?since=0');
  assert('GET /chat/messages без сессии → 401', r.status === 401, `got ${r.status}`);

  r = await req('POST', '/chat/send', 401, { message: 'test' });
  assert('POST /chat/send без сессии → 401', r.status === 401, `got ${r.status}`);

  r = await req('GET', '/chat/unread-count');
  assert('GET /chat/unread-count без сессии → 401', r.status === 401, `got ${r.status}`);

  // ── Admin (без сессии — 403) ──
  console.log('\n[ Admin API — без авторизации ]');
  r = await req('GET', '/chat/admin/users');
  assert('GET /chat/admin/users без сессии → 403', r.status === 403, `got ${r.status}`);

  // ── Admin страница ──
  r = await req('GET', '/admin/login');
  assert('GET /admin/login → 200', r.status === 200, `got ${r.status}`);

  // ── 404 ──
  console.log('\n[ Прочее ]');
  r = await req('GET', '/nonexistent-page-xyz');
  assert('GET /несуществующая → не 200', r.status !== 200, `got ${r.status}`);

  // ── Итог ──
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Всего: ${passed + failed}  |  ✅ Прошло: ${passed}  |  ❌ Упало: ${failed}`);
  if (failed > 0) {
    console.log('\nНеудавшиеся тесты:');
    results.filter(t => !t.ok).forEach(t => console.log(`  - ${t.name}: ${t.detail}`));
    process.exit(1);
  } else {
    console.log('\n✅ Все тесты прошли!\n');
    process.exit(0);
  }
}

run().catch(e => { console.error('Ошибка запуска тестов:', e); process.exit(1); });
