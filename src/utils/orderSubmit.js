// 주문 저장 — 한 건(POST /api/orders) · 배송+픽업 나눠 결제(POST /api/orders/checkout) · 거절 이유 풀기
// (2026-11-17 밤샘 지시 6 — 주류 S51·S52 · 409 처리)
//
// 🔴 예전엔 결제 창을 연 뒤 주문 저장을 **기다리지 않고**(.catch(console.error)) 바로 「주문 완료」 화면으로 갔다.
//    서버가 409(금액이 바뀜 · 주류는 나눠 결제)·403(본인확인 전)으로 거절해도 손님은 「주문이 완료됐어요」를 봤고,
//    주문은 어디에도 없었다. 이제 저장이 끝나야 완료 화면으로 가고, 거절되면 그 이유를 말하고 장바구니를 다시 확인한다.

/** 한 주문의 공통 칸 — 주문서(useCheckoutFlow.buildOrderExtras)가 만든 값을 그대로 싣는다(견적과 같은 값) */
function orderBody(id, x, user) {
  const pickup = x.fulfillment === 'pickup';
  return {
    id,
    fulfillment: pickup ? 'pickup' : 'delivery',
    ...(pickup ? {} : {
      address: x.address || user?.address || '',
      addressDetail: x.addressDetail || user?.address_detail || '',
      zipcode: x.zipcode || '',
      dong: x.dong || '',   // 배송비는 서버가 이 dong 으로 zone 을 다시 읽어 계산(화면 값을 믿지 않는다)
    }),
    use_points: x.use_points || 0,
    coupon_id: x.coupon_id || null,
    coupon_code: x.coupon_code || null,
    receiverName: x.receiverName || user?.name || '',
    receiverPhone: x.receiverPhone || user?.phone || '',
    items: x.items,
  };
}

/**
 * 서버에 보낼 요청 하나를 만든다.
 *   extras.split 이 있으면 → { path: '/orders/checkout', body: { final_amount, orders: [배송, 픽업] } }
 *   아니면              → { path: '/orders', body: { ...한 주문, final_amount } }
 * 나눠 결제의 두 주문 번호는 `<번호>-D` · `<번호>-P`(서버가 다른 번호를 요구한다 · orders.id 50자 안).
 */
export function buildOrderRequest(orderId, finalPrice, extras = {}, user = null) {
  const storeId = extras.split ? extras.split.delivery.store_id : extras.store_id;   // owner 미리보기 전용 — 서버가 role 을 보고만 쓴다
  if (extras.split) {
    return {
      path: '/orders/checkout',
      body: {
        final_amount: finalPrice,
        store_id: storeId,
        orders: [
          orderBody(`${orderId}-D`, { ...extras.split.delivery, fulfillment: 'delivery' }, user),
          orderBody(`${orderId}-P`, { ...extras.split.pickup, fulfillment: 'pickup' }, user),
        ],
      },
    };
  }
  return { path: '/orders', body: { ...orderBody(orderId, extras, user), final_amount: finalPrice, store_id: storeId } };
}

/**
 * 서버가 주문을 거절한 이유 → 손님에게 할 말과 할 일.
 *   refresh: 장바구니를 서버에서 다시 확인한다(금액·나눔·판매 여부가 바뀌었다)
 *   verify:  본인확인으로 보낸다
 */
export function orderErrorAction(err) {
  const res = err && err.response;
  if (!res) return { title: '주문을 보내지 못했어요', message: '인터넷 연결을 확인하고 다시 시도해 주세요. 결제는 되지 않았어요.' };
  const d = res.data || {};
  switch (d.code) {
    case 'AMOUNT_MISMATCH':
      return { title: '그 사이 금액이 바뀌었어요', message: '행사·쿠폰·배송비가 바뀌었을 수 있어요. 장바구니를 다시 확인한 뒤 결제해 주세요.', refresh: true };
    case 'SPLIT_REQUIRED':
      return { title: '주문을 둘로 나눠야 해요', message: '주류는 매장 픽업이라 배송 주문과 픽업 주문으로 나눠서 결제해요. 장바구니에서 다시 주문해 주세요.', refresh: true };
    case 'PICKUP_REQUIRED':
      return { title: '주류는 매장 픽업이에요', message: '주류는 배송하지 않아요. 장바구니에서 다시 주문하면 매장 픽업으로 나눠 드려요.', refresh: true };
    case 'PICKUP_NOT_AVAILABLE':
      return { title: '매장 픽업을 할 수 없어요', message: d.error || '매장 픽업은 주류가 든 주문만 할 수 있어요.', refresh: true };
    case 'ALCOHOL_ADULT_REQUIRED':
      return { title: '19세 이상 본인확인이 필요해요', message: d.error || '주류는 19세 이상 본인확인 뒤에 살 수 있어요.', verify: true };
    case 'ALCOHOL_NOT_SOLD':
      return { title: '이 매장은 주류를 팔지 않아요', message: d.error || '주류를 빼고 다시 주문해 주세요.', refresh: true };
    case 'COUPON_ONE_ONLY':
      return { title: '쿠폰은 한 장만 쓸 수 있어요', message: d.error || '쿠폰을 하나만 골라 주세요.' };
    default:
      return { title: '주문하지 못했어요', message: d.error || '잠시 후 다시 시도해 주세요.', refresh: res.status === 409 };
  }
}
