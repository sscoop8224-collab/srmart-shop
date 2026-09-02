import { useEffect } from 'react';

// 화면마다 하단에 떠 있는 고정 액션바(장바구니담기/바로주문, 결제 요약바 등)의 실측 높이를
// 전역 CSS 변수(--bottom-bar-extra)로 퍼블리시한다. Chatbot의 AI 상담 버튼이 이 변수를 구독해
// 자기 위치를 그만큼 끌어올려, 화면마다 다른 하단바 높이에도 콘텐츠를 가리지 않게 한다.
// NAV_BASE(App.css --bottom-nav-height와 동일)까지는 이미 기본 여백에 포함돼 있으므로 그 초과분만 반영.
const NAV_BASE = 68;

export default function usePublishBottomBarHeight(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const apply = () => {
      const extra = Math.max(0, el.offsetHeight - NAV_BASE);
      document.documentElement.style.setProperty('--bottom-bar-extra', `${extra}px`);
    };
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--bottom-bar-extra', '0px');
    };
  }, [ref]);
}
