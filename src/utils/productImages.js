// 상품 사진 목록 — 대표 사진(image) + 추가 사진(gallery_images) (개발 표 #22 · 2026-11-17 낮 지시 5)
//
//   서버는 /api/products/active · 검색에 products.gallery_images(JSON 배열 · migration_shop_promo_pricing_v1)를 이미 싣는다.
//   예전엔 앱이 목록을 받을 때 images: [] 로 두어 추가 사진이 있어도 상세에 한 장만 보였다(비교 README bundle3 「사진 넘김·썸네일」).
//   🔴 추가 사진을 넣는 어드민 화면은 아직 없다 — 지금 운영은 0개라 화면은 그대로다. 들어오는 날 상세에 넘김·썸네일이 나온다.
//   JSON 이 글자로 와도(드라이버에 따라) 받는다. 같은 주소는 한 번만, 글자가 아닌 것은 버린다.
export function galleryOf(p) {
  const g = p && p.gallery_images;
  let arr = g;
  if (typeof g === 'string') { try { arr = JSON.parse(g); } catch (e) { arr = []; } }
  return Array.isArray(arr) ? arr.filter(u => typeof u === 'string' && u.trim()) : [];
}

export function productImages(p) {
  if (!p) return [];
  if (Array.isArray(p.images) && p.images.length) return p.images;
  const out = [];
  for (const u of [p.image, ...galleryOf(p)]) if (typeof u === 'string' && u.trim() && !out.includes(u)) out.push(u);
  return out;
}
