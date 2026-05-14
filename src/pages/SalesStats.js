function SalesStats({ orders, products, goBack }) {
  const totalSales = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === '배송완료').length;
  const canceledOrders = orders.filter((o) => o.status === '취소').length;

  const productSales = {};
  orders.forEach((order) => {
    if (order.status === '취소') return;
    order.items.forEach((item) => {
      if (!productSales[item.name]) productSales[item.name] = { quantity: 0, revenue: 0 };
      productSales[item.name].quantity += item.quantity;
      productSales[item.name].revenue += item.price * item.quantity;
    });
  });
  const topProducts = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);

  const categorySales = {};
  orders.forEach((order) => {
    if (order.status === '취소') return;
    order.items.forEach((item) => {
      const cat = item.large || '기타';
      if (!categorySales[cat]) categorySales[cat] = 0;
      categorySales[cat] += item.price * item.quantity;
    });
  });
  const topCategories = Object.entries(categorySales).sort((a, b) => b[1] - a[1]);
  const maxRevenue = topProducts.length > 0 ? topProducts[0][1].revenue : 1;
  const maxCat = topCategories.length > 0 ? topCategories[0][1] : 1;

  const rankColor = (i) => i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#e8faf3';
  const rankTextColor = (i) => i < 3 ? 'white' : '#00a85e';

  return (
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '38px', height: '38px', background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a85e' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>매출 통계</h2>
      </div>

      {/* 요약 카드 */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { label: '총 매출', value: '₩' + totalSales.toLocaleString(), color: '#00c471', bg: '#f0faf5',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
          { label: '전체 주문', value: totalOrders + '건', color: '#1a73e8', bg: '#e8f0fe',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
          { label: '배송완료', value: completedOrders + '건', color: '#00a85e', bg: '#f0faf5',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
          { label: '취소', value: canceledOrders + '건', color: '#ff4757', bg: '#fff0f1',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
        ].map((item) => (
          <div key={item.label} style={{ background: 'white', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0faf5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '34px', height: '34px', background: item.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
              <span style={{ fontSize: '12px', color: '#adb5bd', fontWeight: '600' }}>{item.label}</span>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '900', color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 상품별 매출 TOP 5 */}
      <div style={{ margin: '0 16px 12px', background: 'white', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0faf5' }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
          상품별 매출 TOP 5
        </p>
        {topProducts.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#adb5bd', textAlign: 'center', padding: '20px 0' }}>주문 데이터가 없어요!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topProducts.map(([name, data], index) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '22px', height: '22px', background: rankColor(index), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: rankTextColor(index), flexShrink: 0 }}>{index + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{data.revenue.toLocaleString()}</p>
                    <p style={{ fontSize: '11px', color: '#adb5bd', margin: 0 }}>{data.quantity}개 판매</p>
                  </div>
                </div>
                <div style={{ height: '6px', background: '#f0faf5', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (data.revenue / maxRevenue * 100) + '%', background: 'linear-gradient(135deg, #00c471, #00a85e)', borderRadius: '3px', transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 카테고리별 매출 */}
      <div style={{ margin: '0 16px 12px', background: 'white', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0faf5' }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          카테고리별 매출
        </p>
        {topCategories.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#adb5bd', textAlign: 'center', padding: '20px 0' }}>주문 데이터가 없어요!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topCategories.map(([cat, revenue]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{cat}</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#00c471' }}>₩{revenue.toLocaleString()}</span>
                </div>
                <div style={{ height: '6px', background: '#f0faf5', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (revenue / maxCat * 100) + '%', background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', borderRadius: '3px', transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상품 현황 */}
      <div style={{ margin: '0 16px', background: 'white', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0faf5' }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          상품 현황
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
          <div style={{ background: '#f8fffe', borderRadius: '14px', padding: '14px', border: '1px solid #f0faf5' }}>
            <p style={{ fontSize: '22px', fontWeight: '900', color: '#1a1a1a', margin: '0 0 4px' }}>{products.length}</p>
            <p style={{ fontSize: '11px', color: '#adb5bd', margin: 0, fontWeight: '600' }}>전체</p>
          </div>
          <div style={{ background: '#fff0f1', borderRadius: '14px', padding: '14px', border: '1px solid #ffd0d4' }}>
            <p style={{ fontSize: '22px', fontWeight: '900', color: '#ff4757', margin: '0 0 4px' }}>{products.filter((p) => p.isSoldOut).length}</p>
            <p style={{ fontSize: '11px', color: '#adb5bd', margin: 0, fontWeight: '600' }}>품절</p>
          </div>
          <div style={{ background: '#f0faf5', borderRadius: '14px', padding: '14px', border: '1px solid #e8faf3' }}>
            <p style={{ fontSize: '22px', fontWeight: '900', color: '#00c471', margin: '0 0 4px' }}>{products.filter((p) => !p.isSoldOut).length}</p>
            <p style={{ fontSize: '11px', color: '#adb5bd', margin: 0, fontWeight: '600' }}>판매중</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesStats;