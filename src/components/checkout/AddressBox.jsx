// 배송지 카드(기본/다른 주소 + Daum 주소검색 + 우편번호/배송권역 확인).
// Cart.js 원본(299~396행)에서 그대로 옮김 — 마크업/스타일/문구 동일.
// props 는 useCheckoutFlow() 의 반환값을 그대로 펼쳐서 넘기면 된다.
function AddressBox({
  darkMode,
  showAddress, setShowAddress,
  useDefaultAddress, handleSwitchAddress,
  hasDefaultAddress, defaultAddress,
  address, setAddress,
  zipcode, setZipcode, setDeliveryInfo,
  handleZipcodeCheck, checkZipcodeValue,
  matchingZipcode, deliveryInfo,
}) {
  const cardBg = darkMode ? '#242424' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg = darkMode ? '#2e2e2e' : '#f8fffe';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';
  const inputStyle = {
    padding: '11px 14px', borderRadius: '12px', border: `1.5px solid ${inputBorder}`,
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
    background: inputBg, width: '100%', boxSizing: 'border-box',
    color: textColor,
  };

  return (
    <div style={{ margin: '0 16px 10px', background: cardBg, borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${borderColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <p style={{ fontSize: '14px', fontWeight: '700', color: textColor, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          배송지
        </p>
        <button onClick={() => setShowAddress(!showAddress)} style={{ padding: '6px 14px', background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#00a85e' }}>
          {showAddress ? '접기' : '변경'}
        </button>
      </div>

      {hasDefaultAddress && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button onClick={() => handleSwitchAddress(true)}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', border: useDefaultAddress ? '2px solid #00c471' : `1.5px solid ${inputBorder}`, background: useDefaultAddress ? (darkMode ? '#2e2e2e' : '#f0faf5') : cardBg, color: useDefaultAddress ? '#00a85e' : subTextColor, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            기본 주소
          </button>
          <button onClick={() => handleSwitchAddress(false)}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', border: !useDefaultAddress ? '2px solid #00c471' : `1.5px solid ${inputBorder}`, background: !useDefaultAddress ? (darkMode ? '#2e2e2e' : '#f0faf5') : cardBg, color: !useDefaultAddress ? '#00a85e' : subTextColor, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            다른 주소
          </button>
        </div>
      )}

      {useDefaultAddress && hasDefaultAddress && (
        <div style={{ background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '12px', padding: '12px 14px', border: `1px solid ${inputBorder}` }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#00a85e', margin: '0 0 4px' }}>✅ 기본 배송지</p>
          <p style={{ fontSize: '13px', color: textColor, margin: '0 0 2px', fontWeight: '600' }}>{defaultAddress.name} · {defaultAddress.phone}</p>
          <p style={{ fontSize: '13px', color: darkMode ? '#c0c0c0' : '#495057', margin: 0 }}>{defaultAddress.address} {defaultAddress.detail}</p>
        </div>
      )}

      {(!useDefaultAddress || !hasDefaultAddress) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="받는 분 이름" style={inputStyle} />
          <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="연락처 (010-0000-0000)" type="tel" style={inputStyle} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={address.address} readOnly placeholder="주소 검색" style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
              onClick={() => {
                if (window.daum) {
                  new window.daum.Postcode({
                    oncomplete: (data) => { setAddress((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress, detail: '' })); if (data.zonecode) { setZipcode(data.zonecode); checkZipcodeValue(data.zonecode, data.bname); } }
                  }).open();
                } else {
                  alert('주소 검색 서비스를 불러오는 중이에요. 직접 입력해주세요.');
                }
              }}
            />
            <button onClick={() => { if (window.daum) { new window.daum.Postcode({ oncomplete: (data) => { setAddress((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress, detail: '' })); if (data.zonecode) { setZipcode(data.zonecode); checkZipcodeValue(data.zonecode, data.bname); } } }).open(); } }}
              style={{ padding: '11px 14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
              주소 찾기
            </button>
          </div>
          <input value={address.detail} onChange={(e) => setAddress({ ...address, detail: e.target.value })} placeholder="상세 주소 (동/호수 등)" style={inputStyle} />
          {address.name && address.phone && address.address && (
            <div style={{ background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '12px', padding: '12px 14px', border: `1px solid ${inputBorder}` }}>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', margin: '0 0 4px' }}>✅ 배송지 입력 완료</p>
              <p style={{ fontSize: '12px', color: darkMode ? '#c0c0c0' : '#495057', margin: 0 }}>{address.name} · {address.phone}</p>
              <p style={{ fontSize: '12px', color: darkMode ? '#c0c0c0' : '#495057', margin: 0 }}>{address.address} {address.detail}</p>
            </div>
          )}
        </div>
      )}

      {/* 우편번호 + 배송 구역 확인 */}
      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: textColor, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          우편번호 (배송지역 확인)
        </p>
        <input
          type="text"
          value={zipcode}
          onChange={(e) => { setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5)); setDeliveryInfo(null); }}
          onBlur={handleZipcodeCheck}
          placeholder="우편번호 5자리"
          maxLength={5}
          style={inputStyle}
        />
        {matchingZipcode && <p style={{ fontSize: 12, color: subTextColor, margin: '4px 0 0' }}>배송 구역 확인 중...</p>}
        {deliveryInfo?.zoneName && (
          <div style={{ fontSize: 13, marginTop: 6, color: '#00a85e', fontWeight: 600 }}>
            ✓ {deliveryInfo.zoneName} 배송 가능
            {deliveryInfo.deliveryFee > 0 && <span style={{ color: '#178a2d' }}> (지역 추가 +{deliveryInfo.deliveryFee.toLocaleString()}원)</span>}
          </div>
        )}
        {deliveryInfo?.error && (
          <div style={{ fontSize: 13, marginTop: 6, color: '#d32f2f', fontWeight: 600 }}>
            ✗ {deliveryInfo.error}
          </div>
        )}
      </div>
    </div>
  );
}

export default AddressBox;
