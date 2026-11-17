// 본인확인 연결부 — 업체와 무관한 흐름 · 가짜 길은 빌드 값이 있을 때만 (2026-11-16 밤샘)
// 네트워크 없음: api 는 가짜 객체, 창은 가짜 window.

jest.mock('../api', () => ({ __esModule: true, default: {} }));

const load = (mock) => {
  let mod;
  const before = process.env.REACT_APP_IDENTITY_MOCK;
  if (mock) process.env.REACT_APP_IDENTITY_MOCK = '1'; else delete process.env.REACT_APP_IDENTITY_MOCK;
  jest.isolateModules(() => { mod = require('./identityClient'); });
  if (before === undefined) delete process.env.REACT_APP_IDENTITY_MOCK; else process.env.REACT_APP_IDENTITY_MOCK = before;
  return mod;
};

const fakeApi = ({ live = true, begun = { tx_id: 't1', mode: 'mock' } } = {}) => {
  const calls = [];
  return {
    calls,
    get: async (url) => { calls.push(['GET', url]); return { data: { live } }; },
    post: async (url, body) => {
      calls.push(['POST', url, body]);
      if (url.endsWith('/start')) return { data: begun };
      if (url === '/identity/complete') return { data: { token: 'tok', name: body.result.name, phone_masked: '010-****-0000', adult: true } };
      throw new Error('모르는 주소 ' + url);
    },
  };
};

const fakeWin = () => {
  const listeners = [];
  const opened = [];
  return {
    opened,
    location: { origin: 'https://www.dongsinmarket.com' },
    addEventListener: (t, f) => { if (t === 'message') listeners.push(f); },
    removeEventListener: (t, f) => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); },
    open: (url, name) => { const p = { url, name, closed: false, close() { this.closed = true; } }; opened.push(p); return p; },
    send: (data, origin = 'https://www.dongsinmarket.com') => listeners.slice().forEach(f => f({ data, origin })),
    listenerCount: () => listeners.length,
  };
};

test('기본 빌드(가짜 꺼짐)에서는 서버가 mock 이어도 가짜 길이 안 열린다', async () => {
  const m = load(false);
  expect(m.MOCK_ON).toBe(false);
  await expect(m.verifyIdentity('signup', { api: fakeApi(), mockInput: { name: '홍길동', birthdate: '19900101', phone: '01000000000' } }))
    .rejects.toMatchObject({ code: 'MOCK_OFF' });
});

test('서버가 꺼져 있으면 시작도 안 한다(IDENTITY_OFF)', async () => {
  const m = load(true);
  const api = fakeApi({ live: false });
  await expect(m.verifyIdentity('signup', { api })).rejects.toMatchObject({ code: 'IDENTITY_OFF' });
  expect(api.calls.filter(c => c[0] === 'POST')).toHaveLength(0);
});

test('가짜 켬 + 서버 mock: 넘긴 값으로 끝까지 — token 을 돌려준다', async () => {
  const m = load(true);
  const api = fakeApi();
  const r = await m.verifyIdentity('signup', { api, mockInput: { name: '홍길동', birthdate: '19900101', phone: '01000000000' } });
  expect(r).toMatchObject({ token: 'tok', name: '홍길동' });
  expect(api.calls.map(c => c[1])).toEqual(['/identity/status', '/identity/start', '/identity/complete']);
});

test('회원 목적은 회원 입구로 시작한다', async () => {
  const m = load(true);
  const api = fakeApi();
  await m.verifyIdentity('phone_change', { api, mockInput: { name: 'a', birthdate: '19900101', phone: '010' } });
  expect(api.calls[1][1]).toBe('/users/me/identity/start');
});

test('업체 창(url): 같은 거래·같은 출처의 결과 메시지만 받는다', async () => {
  const m = load(false);
  const win = fakeWin();
  const p = m.openVendor({ tx_id: 'tx9', url: 'https://vendor.example/auth' }, { win, timeoutMs: 5000 });
  expect(win.opened[0].url).toBe('https://vendor.example/auth');
  win.send({ type: 'srm-identity-result', tx_id: 'other', result: { x: 1 } });            // 다른 거래 — 무시
  win.send({ type: 'srm-identity-result', tx_id: 'tx9', result: { x: 2 } }, 'https://evil.example');   // 다른 출처 — 무시
  win.send({ type: 'srm-identity-result', tx_id: 'tx9', result: { x: 3 } });
  await expect(p).resolves.toEqual({ x: 3 });
  expect(win.opened[0].closed).toBe(true);
  expect(win.listenerCount()).toBe(0);
});

test('업체 창: 시간이 지나면 TIMEOUT · 팝업이 막히면 POPUP_BLOCKED', async () => {
  const m = load(false);
  const win = fakeWin();
  await expect(m.openVendor({ tx_id: 't', url: 'https://v/' }, { win, timeoutMs: 10 })).rejects.toMatchObject({ code: 'TIMEOUT' });
  const blocked = { ...fakeWin(), open: () => null };
  await expect(m.openVendor({ tx_id: 't', url: 'https://v/' }, { win: blocked, timeoutMs: 1000 })).rejects.toMatchObject({ code: 'POPUP_BLOCKED' });
});

test('업체 정보가 없으면 NO_VENDOR · 모르는 목적은 BAD_PURPOSE', async () => {
  const m = load(false);
  await expect(m.openVendor({ tx_id: 't' }, { win: fakeWin() })).rejects.toMatchObject({ code: 'NO_VENDOR' });
  await expect(m.startIdentity('steal', fakeApi())).rejects.toMatchObject({ code: 'BAD_PURPOSE' });
});
