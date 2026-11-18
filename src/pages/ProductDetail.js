// 상품 상세 (목업 정본 v1 의 S04 · S05, 묶음 3 · 2026-11-12 밤)
//
// 사진(넘김·썸네일) → 분류 길 · 이름 규격 · 별점·행사·품절 · 가격 · 배송 한 줄 → 제조사/원산지 · 바코드 · 재고(상태로) →
// 구매 단위(낱개/박스) · 수량 또는 무게 → 상품 설명 → 상품 정보(영양 사진) → 리뷰 → 관련 상품.
// 아래 고정 바: 합계 · 「장바구니 담기」 · 「바로 주문」. 리뷰를 쓰는 동안은 바가 「취소 · 리뷰 등록」(S05 — 본문 단추가 바 밑에 깔리던 것).
// 이 화면에는 탭바가 없다(App.js). 색·크기는 styles/shop.css(토큰 이름만).
import { useState, useEffect, useRef } from 'react';
import { productImages } from '../utils/productImages';
import { getProductReviews, createReview, getRelatedProducts, recordRecentView, imgUrl } from '../api';
import { buildCartItem } from '../utils/cartItem';
import usePublishBottomBarHeight from '../hooks/usePublishBottomBarHeight';
import { useDialog } from '../DialogContext';
import Icon from '../components/ui/Icon';
import { ProductCard, DeliveryLine, useDeliveryPromise } from './Home';

const getCategoryImage = (large) => {
  switch(large) {
    case '식품': return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80';
    case '음료': return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80';
    case '생활용품': return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80';
    case '간식/과자': return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80';
    case '주류': return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80';
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80';
  }
};
const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;

// 재고는 숫자를 그대로 보이지 않는다(B-5) — 서버의 stock_state 가 있으면 그것, 없으면(옛 서버) 숫자로 같은 판정
function stockView(p) {
  const st = p.stock_state || (p.stock == null ? null : Number(p.stock) <= 0 ? 'soldout' : Number(p.stock) <= 10 ? 'low' : 'in_stock');
  if (st === 'soldout' || p.isSoldOut) return { text: '품절', cls: 'bad', sold: true };
  if (st === 'low') return { text: `${p.stock_left ?? p.stock}개 남음`, cls: 'warn' };
  if (st === 'in_stock') return { text: '재고 있음', cls: '' };
  return null;
}

function Stars({ n, size = 'sm' }) {
  return <span className="stars">{[1, 2, 3, 4, 5].map(i => <Icon key={i} name="star" size={size} fill={i <= n} />)}</span>;
}

function ProductDetail({ product, onBack, onAddToCart, onBuyNow, user, storeId, storeShort, wished, wishlist = [], onToggleWish, onNeedLogin, onOpenProduct, adultOk }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [grams, setGrams] = useState(100);
  const [purchaseType, setPurchaseType] = useState('single');
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [related, setRelated] = useState([]);
  // 🔴 리뷰를 못 불러왔다는 사실. 빈 문자열이면 정상(= 진짜로 리뷰가 없다).
  const [reviewsError, setReviewsError] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const cartBarRef = useRef(null);
  usePublishBottomBarHeight(cartBarRef);
  const { notify } = useDialog();
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const promise = useDeliveryPromise(storeId);

  useEffect(() => {
    if (!product) return;
    setSelectedImage(0); setQuantity(1); setGrams(100); setPurchaseType('single'); setShowReviewForm(false);
    // swallow-ok: 최근 본 상품 기록은 **손님 화면에 아무것도 바꾸지 않는다**(나중에
    //   다른 화면의 목록에 한 줄 덜 뜰 뿐). 알려도 손님이 할 일이 없고 금액·장부와도 무관하다.
    if (user) recordRecentView(product.id).catch(() => {});
    // 🔴 **리뷰는 조용히 비워 두면 안 된다** (2026-10-22 지시 3).
    //    실패하면 reviews 가 빈 배열로 남고, 화면은 「첫 리뷰를 작성해 주세요!」를
    //    띄운다 — 🔴 리뷰가 20개 있어도 손님에게는 "리뷰 없는 상품" 으로 보인다.
    //    그건 틀린 말이고, 손님의 구매 판단을 바꾼다.
    setReviewsError('');
    getProductReviews(product.id)
      .then(r => { setReviews(r.data.reviews || []); setReviewStats(r.data.stats); })
      .catch((e) => setReviewsError(!e?.response ? 'internet' : 'server'));
    // swallow-ok: 관련 상품은 **곁들임**이다 — 못 불러오면 그 줄이 안 뜨고, 보고 있는
    //   상품의 정보·가격·리뷰는 그대로다. 여기까지 경고를 띄우면 정작 중요한 경고가 묻힌다.
    getRelatedProducts(product.id).then(r => setRelated(r.data || [])).catch(() => {});
    window.scrollTo(0, 0);
  }, [product?.id]); // eslint-disable-line

  const openReviewForm = () => {
    if (!user) { onNeedLogin?.('리뷰 쓰기는'); return; }
    setShowReviewForm(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.content.trim()) { notify({ icon: 'alert', title: '리뷰 내용을 적어 주세요' }); return; }
    setSubmittingReview(true);
    try {
      await createReview({ product_id: product.id, rating: reviewForm.rating, content: reviewForm.content });
      notify({ icon: 'check', title: '리뷰를 등록했어요' });
      setShowReviewForm(false);
      setReviewForm({ rating: 5, content: '' });
      const r = await getProductReviews(product.id);
      setReviews(r.data.reviews || []); setReviewStats(r.data.stats);
    } catch (err) { notify({ icon: 'alert', title: '리뷰를 등록하지 못했어요', message: err.response?.data?.error || '잠시 뒤 다시 시도해 주세요.' }); }
    finally { setSubmittingReview(false); }
  };

  if (!product) return null;

  const images = productImages(product);   // 대표 + 추가 사진(gallery_images) — 서버가 주면 넘김·썸네일(2026-11-17 낮 지시 5)
  const weight = product.pricing_type === 'weight';
  const unit = product.unit_price || product.price;
  const hasBox = !!(product.box_price_override && product.box_quantity);
  const stock = stockView(product);
  const sold = !!(stock && stock.sold);
  const total = weight ? unit * grams / 100
    : hasBox && purchaseType === 'box' ? product.box_price_override * quantity
    : product.price * quantity;
  const nutrition = (() => {
    const imgs = Array.isArray(product.nutrition_images) ? product.nutrition_images.filter(Boolean)
      : typeof product.nutrition_images === 'string' ? (() => { try { return JSON.parse(product.nutrition_images) || []; } catch { return []; } })() : [];
    if (product.nutritionImage && !imgs.length) imgs.push(product.nutritionImage);   // 레거시 단일 호환
    return imgs;
  })();
  const fresh = ['농산물', '축산물', '수산물'].includes(product.product_type);

  // 박스 구매도 단품처럼 count 만큼 담기 — 화면에 보이는 '박스가 × 수량' 합계와
  // 실제 장바구니에 담기는 수량이 일치한다(예전엔 박스가 항상 1개만 담겼음).
  // 2026-11-13 서버 장바구니부터는 반복 호출하지 않고 수량을 **한 번에** 보낸다(서버 요청이 수량만큼 나가지 않게).
  const handleAddToCart = () => {
    const { item, count } = buildCartItem(product, { quantity, purchaseType, grams });
    onAddToCart(item, count);
  };

  // 장바구니를 거치지 않고 바로 결제로 진입. buildCartItem 을 handleAddToCart 와 공유하므로
  // 계량/박스/단품 가격·수량 계산이 두 버튼에서 갈리지 않는다. count 는 단일 아이템의
  // quantity 필드로 직접 들어간다(담기처럼 반복 호출하지 않음 — 여긴 카트가 아니라 1건뿐).
  const handleBuyNow = () => {
    const { item, count } = buildCartItem(product, { quantity, purchaseType, grams });
    onBuyNow({ ...item, quantity: count });
  };

  const img = images[selectedImage];

  return (
    <div className="v2 plain detail-v2">
      <header className="nav-clear">
        <div className="nav-row">
          <button className="circle-btn" aria-label="뒤로" onClick={onBack}><Icon name="chevL" size="sm" /></button>
          <button className={`circle-btn${wished ? ' on' : ''}`} aria-label={wished ? '찜 빼기' : '찜'}
            onClick={() => (user ? onToggleWish?.(product) : onNeedLogin?.('찜은'))}>
            <Icon name="heart" size="sm" fill={!!wished} />
          </button>
        </div>
      </header>

      <div className="hero-wrap">
        <div>
          <div className="hero">
            <div className="pimg">
              <img src={img ? imgUrl(img) : getCategoryImage(product.large)} alt={product.name} />
            </div>
            {images.length > 1 && <div className="dots">{images.map((_, i) => <i key={i} className={i === selectedImage ? 'on' : ''} />)}</div>}
          </div>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((src, i) => (
                <button key={i} className={`pimg${i === selectedImage ? ' on' : ''}`} onClick={() => setSelectedImage(i)} aria-label={`사진 ${i + 1}`}>
                  <img src={imgUrl(src)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="d-head">
            <div className="crumb">
              {[product.large, product.medium, product.small].filter(Boolean).map((c, i) => (
                <span key={i} style={{ display: 'contents' }}>{i > 0 && <Icon name="chevR" size="sm" />}{c}</span>
              ))}
            </div>
            <h1>{product.name}{product.spec && <> <span className="spec">{product.spec}</span></>}</h1>
            <div className="tags">
              {reviewStats && reviewStats.total > 0 && (
                <span className="rating"><Icon name="star" size="sm" fill /><b>{reviewStats.avg_rating}</b>({reviewStats.total})</span>
              )}
              {product.eventLabel && <span className="pill solid-r">{product.eventLabel}</span>}
              {sold && <span className="pill r">품절</span>}
            </div>
            <div className="price">
              {weight ? <>{won(unit)}<span className="was per">/100g</span></> : won(product.price)}
            </div>
            {!sold && promise && promise.mode !== 'off' && (
              <div style={{ marginTop: 'var(--sp-3)' }}><DeliveryLine p={promise} storeShort={storeShort} /></div>
            )}
          </div>

          <section className="sec">
            <div className="group">
              {fresh ? (product.origin_country && <div className="row"><span className="lbl">원산지</span><span className="val">{product.origin_country}</span></div>)
                : (product.manufacturer && <div className="row"><span className="lbl">제조사</span><span className="val">{product.manufacturer}</span></div>)}
              {product.barcode && <div className="row"><span className="lbl">바코드</span><span className="val">{product.barcode}</span></div>}
              {stock && <div className="row"><span className="lbl">재고</span><span className={`val ${stock.cls}`}>{stock.text}</span></div>}
            </div>
          </section>

          {!sold && (weight ? (
            <section className="sec">
              <div className="sec-h">무게</div>
              <div className="group pad spread">
                <div><b>{grams}g</b><div className="f-hint">100g당 {won(unit)}</div></div>
                <span className="step">
                  <button aria-label="100g 빼기" disabled={grams <= 100} onClick={() => setGrams(Math.max(100, grams - 100))}><Icon name="minus" size="sm" /></button>
                  <span>{grams}g</span>
                  <button aria-label="100g 더하기" onClick={() => setGrams(grams + 100)}><Icon name="plus" size="sm" /></button>
                </span>
              </div>
            </section>
          ) : (
            <>
              {hasBox && (
                <section className="sec">
                  <div className="sec-h">구매 단위</div>
                  <div className="optrow" role="radiogroup" aria-label="구매 단위">
                    <button role="radio" aria-checked={purchaseType === 'single'} className={`opt${purchaseType === 'single' ? ' on' : ''}`} onClick={() => setPurchaseType('single')}>
                      <b>낱개</b><span>{won(product.price)}</span>
                    </button>
                    <button role="radio" aria-checked={purchaseType === 'box'} className={`opt${purchaseType === 'box' ? ' on' : ''}`} onClick={() => setPurchaseType('box')}>
                      <b>박스 ({product.box_quantity}개)</b><span>{won(product.box_price_override)}</span>
                    </button>
                  </div>
                </section>
              )}
              <section className="sec">
                <div className="group pad spread">
                  <span>수량</span>
                  <span className="step">
                    <button aria-label="하나 빼기" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}><Icon name="minus" size="sm" /></button>
                    <span>{quantity}</span>
                    <button aria-label="하나 더하기" onClick={() => setQuantity(quantity + 1)}><Icon name="plus" size="sm" /></button>
                  </span>
                </div>
              </section>
            </>
          ))}
        </div>
      </div>

      {product.description && (
        <section className="sec">
          <div className="sec-h">상품 설명</div>
          <div className="group pad"><div className="desc">{product.description}</div></div>
        </section>
      )}

      {nutrition.length > 0 && (
        <section className="sec">
          <div className="sec-h">상품 정보</div>
          {nutrition.map((src, i) => <div key={i} className="info-img"><img src={imgUrl(src)} alt={`상품 정보 ${i + 1}`} /></div>)}
        </section>
      )}

      {/* 리뷰 — 🔴 「리뷰 없음」과 「못 불러옴」을 가른다(둘을 같은 문구로 보이면 리뷰 있는 상품이 없는 것처럼 보인다) */}
      {showReviewForm && (
        <section className="sec">
          <div className="group pad">
            <div style={{ textAlign: 'center' }}>
              <div className="f-hint">이 상품 어떠셨어요?</div>
              <div className="stars big" style={{ marginTop: 'var(--sp-2)' }} role="radiogroup" aria-label="별점">
                {[1, 2, 3, 4, 5].map(r => (
                  <button key={r} role="radio" aria-checked={reviewForm.rating === r} aria-label={`${r}점`} onClick={() => setReviewForm(f => ({ ...f, rating: r }))}>
                    <Icon name="star" fill={r <= reviewForm.rating} />
                  </button>
                ))}
              </div>
            </div>
            <textarea className="area" style={{ marginTop: 'var(--sp-3)' }} rows={4} value={reviewForm.content}
              onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))} placeholder="맛·양·배송은 어땠는지 적어 주세요" aria-label="리뷰 내용" />
          </div>
        </section>
      )}
      {reviewsError ? (
        <section className="sec">
          <div className="notice r" role="alert"><Icon name="wifiOff" /><div><b>리뷰를 불러오지 못했어요</b><br />{reviewsError === 'internet' ? '인터넷 연결을 확인해 주세요.' : '잠시 뒤 다시 열어 주세요.'}</div></div>
        </section>
      ) : reviews.length === 0 ? (
        !showReviewForm && (
          <section className="sec">
            <div className="sec-h">리뷰</div>
            <div className="group">
              <div className="ui-empty">
                <div className="big"><Icon name="msg" /></div>
                <h3>아직 리뷰가 없어요</h3>
                <p>첫 리뷰를 작성해 주세요!</p>
                <button className="ui-btn md pri" onClick={openReviewForm}>리뷰 쓰기</button>
              </div>
            </div>
          </section>
        )
      ) : (
        <section className="sec">
          <div className="sec-h">
            <span>리뷰 {reviewStats?.total ?? reviews.length}개{showReviewForm && reviewStats?.avg_rating ? ` · 평균 ${reviewStats.avg_rating}` : ''}</span>
            {!showReviewForm && <> · <button className="link" onClick={openReviewForm}>리뷰 쓰기</button></>}
          </div>
          <div className="group">
            {reviews.map(r => (
              <div key={r.id} className="review">
                <div className="who">
                  <span><Stars n={r.rating} /> {r.user_name || '익명'}</span>
                  <span>{new Date(r.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, '')}</span>
                </div>
                <p>{r.content}</p>
                {r.reply && <div className="reply">사장님 답글 · {r.reply}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <>
          <div className="list-h"><h3>관련 상품</h3></div>
          <div className="hscroll">
            {related.map(p => (
              <ProductCard key={p.id} product={{ ...p, isAdult: !!(p.is_adult ?? p.isAdult), isSoldOut: p.isSoldOut ?? (p.is_available === 0 || (p.stock != null && Number(p.stock) <= 0)) }}
                adultOk={adultOk} fallbackImage={getCategoryImage}
                wished={wishlist.some((w) => w.id === p.id)} onWish={(x) => (user ? onToggleWish?.(x) : onNeedLogin?.('찜은'))}
                onOpen={(x) => onOpenProduct?.(x)} onAdd={(x) => onAddToCart(x)} />
            ))}
          </div>
        </>
      )}

      <div className="pad-bar" />
      <div ref={cartBarRef} className="bar pd-bar">
        <div className="in">
          {showReviewForm ? (
            <>
              <button className="ui-btn gray" style={{ flex: 1 }} onClick={() => { setShowReviewForm(false); setReviewForm({ rating: 5, content: '' }); }}>취소</button>
              <button className="ui-btn pri" style={{ flex: 2 }} disabled={submittingReview} onClick={handleSubmitReview}>{submittingReview ? '등록 중…' : '리뷰 등록'}</button>
            </>
          ) : sold ? (
            <button className="ui-btn full dis" disabled>품절된 상품이에요</button>
          ) : (
            <>
              <div className="sum"><small>합계</small><b>{won(total)}</b></div>
              <button className="ui-btn sec" onClick={handleAddToCart}>장바구니 담기</button>
              <button className="ui-btn pri" onClick={handleBuyNow}>바로 주문</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
