# 모바일 메뉴 슬라이드 패널 렌더링 깨짐

## 증상

모바일 햄버거 메뉴를 클릭하면:

1. 슬라이드 애니메이션이 동작하지 않음
2. 패널이 투명하게 렌더링되어 본문 콘텐츠와 겹쳐 보임

## 원인

두 가지 원인이 복합적으로 작용했다.

1. **애니메이션**: `animate-in slide-in-from-right` 클래스를 직접 사용했으나, `tw-animate-css`는 `data-open:animate-in` 같은 조건부 형태로 동작하도록 설계되어 있어 React의 조건부 렌더링(`{open && ...}`)과 호환되지 않음
2. **투명 패널**: 오버레이와 패널이 Header(`backdrop-blur-sm bg-background/60`) DOM 내부에서 렌더링되어, 부모의 반투명+블러 효과를 상속받아 패널 배경이 투명하게 보임

## 해결

1. `tw-animate-css` 의존 대신 Tailwind CSS `transition-transform`으로 직접 구현. `open`(트랜지션 상태)/`visible`(DOM 마운트 여부) 두 상태를 분리하여 마운트 후 트랜지션이 동작하도록 변경
2. `createPortal(... , document.body)`로 오버레이와 패널을 `<body>` 직접 자식으로 렌더링하여 Header의 CSS 효과에서 독립

```tsx
import { createPortal } from "react-dom";

const [open, setOpen] = useState(false);
const [visible, setVisible] = useState(false);

// Header DOM 바깥(body)에 렌더링
{
  visible &&
    createPortal(
      <>
        {/* Overlay */}
        <div
          className={cn(
            "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        {/* Panel */}
        <nav
          className={cn(
            "bg-background fixed inset-y-0 right-0 z-50 w-64 transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "translate-x-full",
          )}
        />
      </>,
      document.body,
    );
}
```

## 관련 파일

- `src/components/islands/MobileNav.tsx`
