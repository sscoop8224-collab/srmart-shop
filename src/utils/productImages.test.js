// 상품 사진 목록 (개발 표 #22 · 2026-11-17 낮 지시 5)
import { productImages, galleryOf } from './productImages';

test('대표 사진 + 추가 사진, 같은 주소는 한 번', () => {
  expect(productImages({ image: '/u/a.jpg', gallery_images: ['/u/b.jpg', '/u/a.jpg', '/u/c.jpg'] })).toEqual(['/u/a.jpg', '/u/b.jpg', '/u/c.jpg']);
});

test('JSON 이 글자로 와도 · 깨졌으면 대표 사진만', () => {
  expect(productImages({ image: '/u/a.jpg', gallery_images: '["/u/b.jpg"]' })).toEqual(['/u/a.jpg', '/u/b.jpg']);
  expect(productImages({ image: '/u/a.jpg', gallery_images: '[깨짐' })).toEqual(['/u/a.jpg']);
  expect(galleryOf({ gallery_images: [null, 3, ' ', '/u/x.jpg'] })).toEqual(['/u/x.jpg']);
});

test('사진이 없으면 빈 목록(상세가 분류 그림으로) · 이미 images 가 있으면 그것', () => {
  expect(productImages({ image: null, gallery_images: null })).toEqual([]);
  expect(productImages({ images: ['/u/z.jpg'], image: '/u/a.jpg' })).toEqual(['/u/z.jpg']);
  expect(productImages(null)).toEqual([]);
});
