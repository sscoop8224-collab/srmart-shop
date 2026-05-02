function SalesStats({ orders, products, goBack }) {
  const totalSales = orders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === '배송완료').length;
  const canceledOrders = orders.filter((o) => o.status === '취소').length;

  // 상품별 판매량
  const productSales = {};
  orders.forEach((order) => {
    if (order.status === '취소') return;
    order.items.forEach((item) => {
      if (!productSales[item.name]) productSales[item.name] = { quantity: 0, revenue: 0 };
      productSales[item.name].quantity += item.quantity;
      productSales[item.name].revenue += item.price * item.quantity;
    });
  });
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  // 카테고리별 매출
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

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>📊 매출 통계</h2>
      </div>

      {/* 요약 카드 */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { label: '총 매출', value: '₩' + totalSales.toLocaleString(), color: '#00c471', bg: '#e8faf3', icon: '💰' },
          { label: '전체 주문', value: totalOrders + '건', color: '#1a73e8', bg: '#e8f0fe', icon: '📋' },
          { label: '배송완료', value: completedOrders + '건', color: '#00a85e', bg: '#e8faf3', icon: '✅' },
          { label: '취소', value: canceledOrders + '건', color: '#ff4757', bg: '#fff0f1', icon: '❌' },
        ].map((item) => (
          <div key={item.label} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: item.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{item.icon}</div>
              <span style={{ fontSize: '12px', color: '#868e96', fontWeight: '600' }}>{item.label}</span>
            </div>
            <p style={{ fontSize: '18px', fontWeight: '900', color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* 상품별 매출 */}
      <div style={{ margin: '0 16px 16px', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: '#212529', margin: '0 0 16px' }}>🏆 상품별 매출 TOP 5</p>
        {topProducts.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#adb5bd', textAlign: 'center', padding: '20px 0' }}>주문 데이터가 없어요!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topProducts.map(([name, data], index) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '20px', height: '20px', background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#e9ecef', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', color: index < 3 ? 'white' : '#868e96', flexShrink: 0 }}>{index + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#212529' }}>{name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{data.revenue.toLocaleString()}</p>
                    <p style={{ fontSize: '11px', color: '#adb5bd', margin: 0 }}>{data.quantity}개 판매</p>
                  </div>
                </div>
                <div style={{ height: '6px', background: '#f1f3f5', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (data.revenue / maxRevenue * 100) + '%', background: 'linear-gradient(135deg, #00c471, #00a85e)', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 카테고리별 매출 */}
      <div style={{ margin: '0 16px 16px', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: '#212529', margin: '0 0 16px' }}>📂 카테고리별 매출</p>
        {topCategories.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#adb5bd', textAlign: 'center', padding: '20px 0' }}>주문 데이터가 없어요!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topCategories.map(([cat, revenue]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#212529' }}>{cat}</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#00c471' }}>₩{revenue.toLocaleString()}</span>
                </div>
                <div style={{ height: '6px', background: '#f1f3f5', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (revenue / maxCat * 100) + '%', background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 상품 현황 */}
      <div style={{ margin: '0 16px', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: '#212529', margin: '0 0 16px' }}>📦 상품 현황</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
          <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '12px' }}>
            <p style={{ fontSize: '22px', fontWeight: '900', color: '#212529', margin: '0 0 4px' }}>{products.length}</p>
            <p style={{ fontSize: '11px', color: '#868e96', margin: 0 }}>전체 상품</p>
          </div>
          <div style={{ background: '#fff0f1', borderRadius: '12px', padding: '12px' }}>
            <p style={{ fontSize: '22px', fontWeight: '900', color: '#ff4757', margin: '0 0 4px' }}>{products.filter((p) => p.isSoldOut).length}</p>
            <p style={{ fontSize: '11px', color: '#868e96', margin: 0 }}>품절 상품</p>
          </div>
          <div style={{ background: '#e8faf3', borderRadius: '12px', padding: '12px' }}>
            <p style={{ fontSize: '22px', fontWeight: '900', color: '#00c471', margin: '0 0 4px' }}>{products.filter((p) => !p.isSoldOut).length}</p>
            <p style={{ fontSize: '11px', color: '#868e96', margin: 0 }}>판매중</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesStats;