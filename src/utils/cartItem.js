// 상품 상세에서 고른 옵션(수량/무게/구매단위)을 카트 아이템으로 변환한다.
// '장바구니 담기'(addToCart 반복 호출·병합)와 '바로 주문'(단일 아이템 1개)이
// 이 함수를 공유해 계량/박스/단품 가격·수량 계산이 두 갈래로 갈리지 않게 한다.
//
// 반환: { item, count }
//   item  — addToCart 에 반복 호출할 '단위 아이템'(quantity 필드는 의미 없음, count 로 반복해 누적)
//           '바로 주문' 쪽에서는 { ...item, quantity: count } 로 단일 아이템을 직접 구성해 쓴다.
//   count — item 을 몇 번 담을지. 화면에 표시된 최종 수량(박스가×수량 등)과 항상 일치해야 한다.
export function buildCartItem(product, { quantity = 1, purchaseType = 'single', grams = 100 } = {}) {
  if (product.pricing_type === 'weight') {
    return { item: { ...product, grams }, count: 1 };
  }
  if (product.box_price_override && purchaseType === 'box') {
    return { item: { ...product, purchase_type: 'box', price: product.box_price_override }, count: quantity };
  }
  return { item: { ...product }, count: quantity };
}
