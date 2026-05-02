import { useEffect, useRef } from 'react';

function PrintReceipt({ order, onClose }) {
  const printRef = useRef(null);

  if (!order) return null;

  const status = order.status || '결제완료';

  // A4 프린터 출력
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>영수증 - ${order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Malgun Gothic', sans-serif; padding: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px; }
            .header h1 { font-size: 22px; font-weight: 900; }
            .header p { font-size: 12px; color: #666; }
            .info { margin-bottom: 12px; font-size: 13px; }
            .info p { margin-bottom: 4px; }
            .divider { border-top: 1px dashed #000; margin: 12px 0; }
            .item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
            .item-name { flex: 1; }
            .item-price { font-weight: 700; }
            .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; margin-top: 8px; }
            .footer { text-align: center; margin-top: 16px; font-size: 12px; color: #666; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>🛒 에스알마트</h1>
              <p>SR Mart - 동신마켓</p>
              <p>신선하고 다양한 상품을 만나보세요</p>
            </div>
            <div class="info">
              <p>주문번호: ${order.id}</p>
              <p>주문일시: ${order.date}</p>
              <p>고객: ${order.userId}</p>
              <p>상태: ${status}</p>
            </div>
            <div class="divider"></div>
            <div class="items">
              ${order.items.map((item) => `
                <div class="item">
                  <span class="item-name">${item.name} x${item.quantity}</span>
                  <span class="item-price">₩${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
            <div class="divider"></div>
            <div class="total">
              <span>총 결제금액</span>
              <span>₩${order.totalPrice.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:6px;">
              <span>배송비</span>
              <span>무료</span>
            </div>
            <div class="divider"></div>
            <div class="footer">
              <p>이용해 주셔서 감사합니다! 😊</p>
              <p>© 2026 Dongsin Market</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // 블루투스 POS 프린터 출력
  const handleBluetoothPrint = async () => {
    if (!navigator.bluetooth) {
      alert('이 기기는 블루투스를 지원하지 않아요!\nA4 프린터로 출력해주세요 😊');
      return;
    }
    try {
      alert('블루투스 프린터를 검색중이에요...\n프린터를 켜고 페어링 해주세요!');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      // ESC/POS 명령어로 영수증 텍스트 생성
      const encoder = new TextEncoder();
      const ESC = 0x1B;
      const GS = 0x1D;

      const lines = [
        '\n',
        '================================\n',
        '       에스알마트 영수증\n',
        '================================\n',
        `주문번호: ${order.id.slice(-8)}\n`,
        `주문일시: ${order.date}\n`,
        `고    객: ${order.userId}\n`,
        '--------------------------------\n',
        ...order.items.map((item) => `${item.name} x${item.quantity}\n         ₩${(item.price * item.quantity).toLocaleString()}\n`),
        '--------------------------------\n',
        `총 결제금액: ₩${order.totalPrice.toLocaleString()}\n`,
        '================================\n',
        '  이용해 주셔서 감사합니다! \n',
        '================================\n',
        '\n\n\n',
      ];

      for (const line of lines) {
        await characteristic.writeValue(encoder.encode(line));
      }
      alert('영수증이 출력됐어요! 🖨️');
      server.disconnect();
    } catch (error) {
      if (error.name === 'NotFoundError') {
        alert('프린터를 찾을 수 없어요!\n프린터가 켜져 있는지 확인해주세요 😊');
      } else {
        alert('블루투스 연결에 실패했어요!\nA4 프린터로 출력해주세요 😊');
      }
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '400px', maxHeight: '90vh', overflow: 'auto' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f3f5' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#212529' }}>🖨️ 영수증 출력</h2>
          <button onClick={onClose} style={{ width: '32px', height: '32px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
        </div>

        {/* 영수증 미리보기 */}
        <div ref={printRef} style={{ padding: '20px', fontFamily: 'monospace', fontSize: '13px', background: '#fafafa', margin: '16px', borderRadius: '12px', border: '1px dashed #dee2e6' }}>
          <div style={{ textAlign: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #000' }}>
            <p style={{ fontSize: '18px', fontWeight: '900', margin: '0 0 4px' }}>🛒 에스알마트</p>
            <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>SR Mart - 동신마켓</p>
          </div>
          <p style={{ margin: '0 0 3px', fontSize: '12px' }}>주문번호: {order.id.slice(-8)}</p>
          <p style={{ margin: '0 0 3px', fontSize: '12px' }}>주문일시: {order.date}</p>
          <p style={{ margin: '0 0 3px', fontSize: '12px' }}>고    객: {order.userId}</p>
          <p style={{ margin: '0 0 12px', fontSize: '12px' }}>상    태: {status}</p>
          <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginBottom: '10px' }}>
            {order.items.map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                <span>{item.name} x{item.quantity}</span>
                <span style={{ fontWeight: '700' }}>₩{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px dashed #000', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
              <span>배송비</span>
              <span style={{ color: '#00c471', fontWeight: '700' }}>무료</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '900' }}>
              <span>총 결제금액</span>
              <span>₩{order.totalPrice.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #000', fontSize: '11px', color: '#666' }}>
            <p style={{ margin: '0 0 2px' }}>이용해 주셔서 감사합니다! 😊</p>
            <p style={{ margin: 0 }}>© 2026 Dongsin Market</p>
          </div>
        </div>

        {/* 출력 버튼 */}
        <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handlePrint} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            🖨️ A4 프린터 출력
          </button>
          <button onClick={handleBluetoothPrint} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #1a73e8, #0d47a1)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            📡 블루투스 POS 프린터 출력
          </button>
          <button onClick={onClose} style={{ width: '100%', padding: '14px', background: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrintReceipt;