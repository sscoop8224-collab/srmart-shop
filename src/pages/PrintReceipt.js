import { useRef } from 'react';

function PrintReceipt({ order, onClose, darkMode }) {
  const printRef = useRef(null);

  if (!order) return null;

  const paymentMethod = order.paymentMethod || '카드';

  const modalBg   = darkMode ? '#1a1a1a' : 'white';
  const headerBorder = darkMode ? '#2e2e2e' : '#f1f3f5';
  const titleColor = darkMode ? '#f0f0f0' : '#212529';
  const closeBg   = darkMode ? '#2e2e2e' : '#f1f3f5';
  const closeColor = darkMode ? '#f0f0f0' : '#333';
  const wrapBg    = darkMode ? '#111' : 'rgba(0,0,0,0.5)';

  const DIVIDER1 = '================================';
  const DIVIDER2 = '--------------------------------';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>영수증 - ${order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Malgun Gothic', 'Courier New', monospace; background: white; display: flex; justify-content: center; padding: 10px; }
            @media print { body { padding: 0; } @page { margin: 5mm; } }
          </style>
        </head>
        <body>${printRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleBluetoothPrint = async () => {
    if (!navigator.bluetooth) {
      alert('블루투스를 지원하지 않는 기기입니다.\nA4 프린터로 출력해주세요.');
      return;
    }
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      const encoder = new TextEncoder();
      const cmd = (...bytes) => new Uint8Array(bytes);
      const txt = (str) => encoder.encode(str);

      const INIT      = cmd(0x1B, 0x40);              // 초기화
      const UTF8_MODE = cmd(0x1C, 0x70, 0x01, 0x00);  // UTF-8 코드페이지
      const CENTER    = cmd(0x1B, 0x61, 0x01);         // 중앙 정렬
      const LEFT      = cmd(0x1B, 0x61, 0x00);         // 왼쪽 정렬
      const BOLD_ON   = cmd(0x1B, 0x45, 0x01);         // 굵게 켜기
      const BOLD_OFF  = cmd(0x1B, 0x45, 0x00);         // 굵게 끄기
      const CUT       = cmd(0x1D, 0x56, 0x41, 0x03);  // 부분 커팅

      const write = async (data) => await characteristic.writeValue(data);

      await write(INIT);
      await write(UTF8_MODE);

      // 헤더
      await write(CENTER);
      await write(BOLD_ON);
      await write(txt('에스알마트\n'));
      await write(BOLD_OFF);
      await write(txt('경기도 오산시 청학로 ○○\n'));
      await write(txt('TEL: 031-000-0000\n'));
      await write(txt(DIVIDER1 + '\n'));

      // 주문 정보
      await write(LEFT);
      await write(txt(`주문번호: ${order.id.slice(-8)}\n`));
      await write(txt(`주문일시: ${order.date}\n`));
      await write(txt(`고    객: ${order.userId}\n`));
      await write(txt(DIVIDER2 + '\n'));

      // 상품 목록
      for (const item of order.items) {
        await write(txt(`${item.name}\n`));
        const subtotal = (item.price * item.quantity).toLocaleString();
        await write(txt(`  ${item.quantity}개 x ${item.price.toLocaleString()}    W${subtotal}\n`));
      }

      await write(txt(DIVIDER2 + '\n'));

      // 합계
      await write(BOLD_ON);
      await write(txt(`합   계         W${order.totalPrice.toLocaleString()}\n`));
      await write(BOLD_OFF);
      await write(txt(`결제수단        ${paymentMethod}\n`));
      await write(txt(DIVIDER1 + '\n'));

      // 푸터
      await write(CENTER);
      await write(txt('이용해 주셔서 감사합니다!\n'));
      await write(txt('© 2026 SR Mart\n'));
      await write(txt('\n\n'));
      await write(CUT);

      alert('영수증이 출력됐어요!');
      server.disconnect();
    } catch (error) {
      if (error.name === 'NotFoundError') {
        alert('프린터를 찾을 수 없어요!\n프린터가 켜져 있는지 확인해주세요.');
      } else {
        alert('블루투스 연결에 실패했어요!\nA4 프린터로 출력해주세요.');
      }
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: wrapBg, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: modalBg, borderRadius: '20px', width: '100%', maxWidth: '360px', maxHeight: '90vh', overflow: 'auto' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${headerBorder}` }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: titleColor }}>영수증 출력</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', background: closeBg, border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', color: closeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* 영수증 미리보기 — POS 80mm */}
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={printRef}
            style={{
              width: '300px',
              fontFamily: "'Courier New', 'Malgun Gothic', monospace",
              fontSize: '12px',
              lineHeight: '1.6',
              background: 'white',
              color: '#000',
              padding: '16px 12px',
              borderRadius: '8px',
              border: '1px dashed #ccc',
            }}
          >
            {/* 로고/가게 정보 */}
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '2px' }}>에스알마트</div>
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>경기도 오산시 청학로 ○○</div>
              <div style={{ fontSize: '11px', color: '#555' }}>TEL: 031-000-0000</div>
            </div>

            <div style={{ borderTop: '2px solid #000', borderBottom: '1px dashed #999', padding: '6px 0', marginBottom: '6px', textAlign: 'center', fontSize: '11px', color: '#555' }}>
              {DIVIDER1}
            </div>

            {/* 주문 정보 */}
            <div style={{ marginBottom: '6px', fontSize: '11px' }}>
              <div>주문번호: <span style={{ fontWeight: '700' }}>{order.id.slice(-8)}</span></div>
              <div>주문일시: {order.date}</div>
              <div>고    객: {order.userId}</div>
            </div>

            <div style={{ borderTop: '1px dashed #999', marginBottom: '8px', paddingTop: '2px', fontSize: '11px', color: '#999', textAlign: 'center' }}>{DIVIDER2}</div>

            {/* 상품 목록 */}
            <div style={{ marginBottom: '8px' }}>
              {order.items.map((item, index) => {
                const subtotal = item.price * item.quantity;
                return (
                  <div key={index} style={{ marginBottom: '5px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600' }}>{item.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#333', paddingLeft: '8px' }}>
                      <span>{item.quantity}개 × ₩{item.price.toLocaleString()}</span>
                      <span style={{ fontWeight: '700' }}>₩{subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px dashed #999', marginBottom: '8px', paddingTop: '2px', fontSize: '11px', color: '#999', textAlign: 'center' }}>{DIVIDER2}</div>

            {/* 합계 */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900' }}>
                <span>합   계</span>
                <span>₩{order.totalPrice.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', marginTop: '4px' }}>
                <span>결제수단</span>
                <span>{paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#00a85e', marginTop: '2px' }}>
                <span>배송비</span>
                <span>무료</span>
              </div>
            </div>

            <div style={{ borderTop: '2px solid #000', marginTop: '8px', paddingTop: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '2px' }}>이용해 주셔서 감사합니다!</div>
              <div style={{ fontSize: '10px', color: '#888' }}>© 2026 SR Mart · Dongsin Market</div>
            </div>
          </div>
        </div>

        {/* 출력 버튼 */}
        <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleBluetoothPrint} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            📡 POS 영수증 출력
          </button>
          <button onClick={handlePrint} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            🖨️ A4 출력
          </button>
          <button onClick={onClose} style={{ width: '100%', padding: '14px', background: darkMode ? '#2a2a2a' : '#f1f3f5', color: darkMode ? '#ccc' : '#495057', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintReceipt;
