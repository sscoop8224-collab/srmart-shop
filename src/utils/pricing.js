// 카트형 아이템 하나의 결제 금액. Cart(여러 개)·QuickOrder(1개)·useCheckoutFlow 가 공유한다.
//   계량(weight) = 100g당 단가 × 무게 / 100
//   그 외(단품/박스) = price(박스면 이미 박스가로 세팅됨) × quantity
export function getItemPrice(item) {
  if (item.pricing_type === 'weight') return (item.unit_price || item.price) * (item.grams || 100) / 100;
  return item.price * item.quantity;
}
