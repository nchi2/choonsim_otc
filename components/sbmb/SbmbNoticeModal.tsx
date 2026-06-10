"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import styled, { keyframes } from "styled-components";
import { T } from "@/lib/sbmb/tokens";

// 오늘 하루 보지 않기 — 다음 자정까지 노출 억제. ISO 문자열로 저장.
const STORAGE_KEY = "sbmb_notice_hidden_until";

// Primary CTA — 참여 신청 섹션 앵커. (필요 시 폼 링크로 교체)
const APPLY_ANCHOR_ID = "apply";

function nextMidnightISO(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

// 저장값이 미래(=아직 자정 전)면 숨김. 파싱 실패/차단 시 안전하게 false(=노출).
function isHiddenNow(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const until = new Date(raw).getTime();
    if (Number.isNaN(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

/* ────────────────────────────────────────────────────────────
 * "노출 가능 여부"를 외부 스토어(localStorage)에서 읽는다.
 * useSyncExternalStore 사용 → effect 내 setState 없이 파생 렌더,
 * 서버 스냅샷은 항상 false(숨김)라 SSR/하이드레이션 불일치도 방지.
 * ──────────────────────────────────────────────────────────── */
function subscribeStorage(callback: () => void): () => void {
  // 다른 탭에서의 변경(storage 이벤트)만 반영하면 충분.
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getCanShowSnapshot(): boolean {
  return !isHiddenNow();
}

// SSR/하이드레이션 시점엔 항상 숨김(false) → 마운트 전 렌더 가드.
function getCanShowServerSnapshot(): boolean {
  return false;
}

export default function SbmbNoticeModal() {
  // localStorage 기반 "노출 가능 여부"는 외부 스토어에서 파생(effect setState 없음).
  const canShow = useSyncExternalStore(
    subscribeStorage,
    getCanShowSnapshot,
    getCanShowServerSnapshot,
  );
  // 이번 세션에서 사용자가 닫았는지(이벤트 핸들러에서만 갱신).
  const [closedThisSession, setClosedThisSession] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // 최종 노출 여부 — 파생값. 서버/마운트 전엔 canShow=false라 null 렌더.
  const open = canShow && !closedThisSession;

  // 열릴 때 본문 스크롤을 항상 최상단으로 리셋.
  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: 0 });
  }, [open]);

  const handleClose = useCallback(() => {
    if (dontShowToday) {
      try {
        window.localStorage.setItem(STORAGE_KEY, nextMidnightISO());
      } catch {
        // 시크릿 모드 등 차단 — 이번 세션만 닫힘.
      }
    }
    setClosedThisSession(true);
  }, [dontShowToday]);

  // body 스크롤 잠금 + 포커스 이동/복원.
  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 열릴 때 모달로 포커스 이동.
    const focusTimer = window.setTimeout(() => {
      cardRef.current?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.clearTimeout(focusTimer);
      // 닫으면 원래 포커스 복원.
      lastFocusedRef.current?.focus?.();
    };
  }, [open]);

  // ESC 닫기 + 포커스 트랩.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;

      const root = cardRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  const handleApply = useCallback(() => {
    setClosedThisSession(true);
    const el = document.getElementById(APPLY_ANCHOR_ID);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (!open) return null;

  return (
    <Dim
      onMouseDown={(e) => {
        // 딤 영역(카드 바깥) 클릭 시에만 닫기.
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <Card
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sbmb-notice-title"
        tabIndex={-1}
      >
        <CloseButton type="button" aria-label="닫기" onClick={handleClose}>
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </CloseButton>

        <ScrollBody ref={bodyRef}>
          <HeaderArea>
            <Title id="sbmb-notice-title">
              SBMB 추가 접수가 시작되었습니다
            </Title>
          </HeaderArea>

          <Body>
            지금 SBMB 신규 참여 신청을 받고 있습니다.
            <br />
            신청은 참여 가능 물량 소진 시 마감되며,
            <br />
            다시 열릴 때 안내 문자를 보내드립니다.
            <br />
            <br />
            아래 버튼에서 바로 신청하실 수 있습니다.
          </Body>
        </ScrollBody>

        <Footer>
          <PrimaryButton type="button" onClick={handleApply}>
            신규 참여 신청하기 →
          </PrimaryButton>

          <FooterRow>
            <CheckLabel>
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
              />
              오늘 하루 보지 않기
            </CheckLabel>
            <TextCloseButton type="button" onClick={handleClose}>
              닫기
            </TextCloseButton>
          </FooterRow>
        </Footer>
      </Card>
    </Dim>
  );
}

/* ──────────────────────────────────────────────────────────── */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const popIn = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Dim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
  animation: ${fadeIn} 0.18s ease;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  /* 모바일 홈바/주소창에서도 잘리지 않도록 dvh 기준 + 절대 상한. */
  max-height: min(90dvh, 760px);
  background: ${T.white};
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(15, 15, 28, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: Pretendard, Inter, system-ui, sans-serif;
  animation: ${popIn} 0.2s ease;
  outline: none;

  /* 데스크탑: 신청 폼 모달과 동일 폭(720)으로 통일. */
  @media (min-width: 768px) {
    max-width: 720px;
    border-radius: 16px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* 본문(스크롤 영역) */
const ScrollBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 28px 24px 16px;

  @media (min-width: 768px) {
    padding: 36px 32px 20px;
  }
`;

/* 푸터(고정) — CTA + 보조 액션. 스크롤과 무관하게 항상 보임. */
const Footer = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px max(22px, env(safe-area-inset-bottom));
  background: ${T.white};
  border-top: 1px solid #f0eff8;

  @media (min-width: 768px) {
    padding: 16px 32px max(28px, env(safe-area-inset-bottom));
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${T.textSecondary};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background: ${T.bgGray};
  }

  &:focus-visible {
    outline: 2px solid ${T.primary};
    outline-offset: 2px;
  }
`;

const HeaderArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 4px;
  text-align: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  color: ${T.textPrimary};
`;

const Body = styled.p`
  margin: 0;
  text-align: center;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: ${T.textSecondary};
`;

const PrimaryButton = styled.button`
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 12px;
  background: ${T.primary};
  color: ${T.white};
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition:
    filter 0.15s ease,
    transform 0.1s ease;

  &:hover {
    filter: brightness(0.95);
  }

  &:active {
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 3px solid ${T.convertDot};
    outline-offset: 2px;
  }
`;

const FooterRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const CheckLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: ${T.textSecondary};
  cursor: pointer;

  input {
    width: 15px;
    height: 15px;
    accent-color: ${T.primary};
    cursor: pointer;
  }
`;

const TextCloseButton = styled.button`
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: ${T.textTertiary};
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: ${T.textSecondary};
  }

  &:focus-visible {
    outline: 2px solid ${T.primary};
    outline-offset: 2px;
  }
`;
