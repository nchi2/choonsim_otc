"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styled, { css, keyframes } from "styled-components";
import { IconMessageCircle, IconX } from "@/components/sbmb/shared/SbmbIcons";
import { SBMB_KAKAO_INQUIRY_URL } from "@/lib/sbmb/constants";
import { T } from "@/lib/sbmb/tokens";

const mobile = "@media (max-width: 767px)";

const DELAY_BEFORE_TYPING_MS = 600;
const TYPING_DURATION_MS = 500;

const fadeSlideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const dotPulse = keyframes`
  0%,
  80%,
  100% {
    opacity: 0.35;
  }
  40% {
    opacity: 1;
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
`;

const Panel = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  background: #ffffff;
  border-radius: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.12);

  ${mobile} {
    top: 0;
    left: 0;
    transform: none;
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }
`;

const HeaderBar = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const HeaderAvatar = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8fd8c7 0%, ${T.mint} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 15px;
  color: #ffffff;
  flex-shrink: 0;
`;

const HeaderTitle = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: #111827;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const TextGhostBtn = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  padding: 8px 10px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;

  &:hover {
    color: #4c4598;
  }
`;

const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  color: ${T.textSecondary};

  &:hover {
    background: #f3f4f6;
    color: ${T.textPrimary};
  }
`;

const MessagesViewport = styled.div`
  flex: 1;
  min-height: 0;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background: #fafafa;
`;

const MessagesColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BotRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 100%;
  align-self: flex-start;
`;

const BotAvatar = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8fd8c7 0%, ${T.mint} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: #ffffff;
  flex-shrink: 0;
`;

const BotBubble = styled.div<{ $animate?: boolean }>`
  max-width: 75%;
  padding: 12px 14px;
  background: #f5f5f5;
  border-radius: 4px 16px 16px 16px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.55;
  color: #111827;
  white-space: pre-wrap;
  word-break: keep-all;
  ${(p) =>
    p.$animate
      ? css`
          animation: ${fadeSlideUp} 0.38s ease-out forwards;
        `
      : undefined}
`;

const BotExtras = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 75%;
`;

const UserRow = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const UserBubble = styled.div`
  max-width: 75%;
  padding: 12px 14px;
  background: #4c4598;
  border-radius: 16px 4px 16px 16px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.5;
  color: #ffffff;
  white-space: pre-wrap;
  word-break: keep-all;
  animation: ${fadeSlideUp} 0.28s ease-out forwards;
`;

const TypingBubble = styled.div`
  padding: 14px 18px;
  background: #f5f5f5;
  border-radius: 4px 16px 16px 16px;
  display: flex;
  gap: 5px;
  align-items: center;
`;

const TypingDot = styled.span<{ $delay: number }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9ca3af;
  animation: ${dotPulse} 1s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay}s;
`;

const KakaoBtn = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 44px;
  border-radius: 10px;
  cursor: pointer;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  color: ${T.kakaoText};
  background: ${T.kakaoYellow};
  border: 1px solid ${T.kakaoBorder};
  text-decoration: none;
  box-sizing: border-box;

  &:hover {
    filter: brightness(0.98);
  }
`;

const UnresolvedHint = styled.p`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 13px;
  color: #6b7280;
  text-align: left;
`;

const ChoicesDock = styled.div`
  flex-shrink: 0;
  padding: 12px 16px 16px;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ChoiceBtn = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  height: 44px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #374151;
  opacity: ${(p) => (p.$disabled ? 0.45 : 1)};
  pointer-events: ${(p) => (p.$disabled ? "none" : "auto")};
  transition: border-color 0.15s ease, color 0.15s ease;

  &:hover {
    border-color: #8fd8c7;
    color: #4c4598;
  }
`;

export type SbmbInquiryFlowModalProps = {
  open: boolean;
  onClose: () => void;
};

type BotPayload = {
  text: string;
  showKakao?: boolean;
  unresolvedHint?: boolean;
};

type ChatEntry =
  | { kind: "user"; id: string; text: string }
  | {
      kind: "bot";
      id: string;
      text: string;
      showKakao?: boolean;
      unresolvedHint?: boolean;
      animate?: boolean;
    }
  | { kind: "typing"; id: string };

type ChoiceItem = {
  label: string;
  run: () => void;
};

let idSeq = 0;
function nextId(prefix: string) {
  idSeq += 1;
  return `${prefix}-${idSeq}-${Date.now()}`;
}

const GREETING_BOT: BotPayload = {
  text: "안녕하세요! 춘심 도우미입니다 😊\n어떤 유형으로 참여하셨나요?",
};

export default function SbmbInquiryFlowModal({
  open,
  onClose,
}: SbmbInquiryFlowModalProps) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [choices, setChoices] = useState<ChoiceItem[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const genRef = useRef(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [entries, scrollToBottom]);

  const runBotReply = useCallback(
    (payload: BotPayload, nextChoices: ChoiceItem[]) => {
      clearTimers();
      const g = genRef.current;
      const typingId = nextId("typing");
      const botId = nextId("bot");
      setBusy(true);
      setChoices([]);

      const t1 = setTimeout(() => {
        if (g !== genRef.current) return;
        setEntries((prev) => [...prev, { kind: "typing", id: typingId }]);

        const t2 = setTimeout(() => {
          if (g !== genRef.current) return;
          setEntries((prev) =>
            prev
              .filter((e) => e.id !== typingId)
              .concat({
                kind: "bot",
                id: botId,
                text: payload.text,
                showKakao: payload.showKakao,
                unresolvedHint: payload.unresolvedHint,
                animate: true,
              }),
          );
          setChoices(nextChoices);
          setBusy(false);
        }, TYPING_DURATION_MS);

        timersRef.current.push(t2);
      }, DELAY_BEFORE_TYPING_MS);

      timersRef.current.push(t1);
    },
    [clearTimers],
  );

  const buildStartChoices = useCallback((): ChoiceItem[] => {
    return [
      {
        label: "10모 단위 참여",
        run: () => {
          const u = nextId("user");
          setEntries((prev) => [
            ...prev,
            { kind: "user", id: u, text: "10모 단위 참여" },
          ]);
          runBotReply(
            { text: "어떤 문제가 발생하셨나요?" },
            [
              {
                label: "성함/연락처 조회가 안돼요",
                run: () => {
                  const id = nextId("user");
                  setEntries((p) => [
                    ...p,
                    { kind: "user", id, text: "성함/연락처 조회가 안돼요" },
                  ]);
                  runBotReply(
                    {
                      text: "신청 당시 SBMB 참여 확인 문자를 받으셨나요?",
                    },
                    [
                      {
                        label: "네, 받았어요",
                        run: () => {
                          const uid = nextId("user");
                          setEntries((p) => [
                            ...p,
                            { kind: "user", id: uid, text: "네, 받았어요" },
                          ]);
                          runBotReply(
                            {
                              text: "신청 시 작성하신 성함·연락처와 다를 경우\n(오타 등) 조회가 안될 수 있어요.\n아래 버튼으로 확인해주세요! 🙏",
                              showKakao: true,
                              unresolvedHint: true,
                            },
                            [],
                          );
                        },
                      },
                      {
                        label: "아니오, 못 받았어요",
                        run: () => {
                          const uid = nextId("user");
                          setEntries((p) => [
                            ...p,
                            {
                              kind: "user",
                              id: uid,
                              text: "아니오, 못 받았어요",
                            },
                          ]);
                          runBotReply(
                            {
                              text: "구글폼 미작성 상태에서 입금만 완료하신\n미확인 참여자분들이 몇 분 계세요.\n카카오톡으로 문의해주시면 안내드릴게요!",
                              showKakao: true,
                            },
                            [],
                          );
                        },
                      },
                    ],
                  );
                },
              },
              {
                label: "지갑 No를 모르겠어요",
                run: () => {
                  const id = nextId("user");
                  setEntries((p) => [
                    ...p,
                    { kind: "user", id, text: "지갑 No를 모르겠어요" },
                  ]);
                  runBotReply(
                    { text: "지갑은 수령하셨나요?" },
                    [
                      {
                        label: "수령했는데 분실했어요",
                        run: () => {
                          const uid = nextId("user");
                          setEntries((p) => [
                            ...p,
                            {
                              kind: "user",
                              id: uid,
                              text: "수령했는데 분실했어요",
                            },
                          ]);
                          runBotReply(
                            {
                              text: "아직 SBMB 에어드랍 전이라\n교환을 도와드릴 수 있어요.\n카카오톡으로 문의해주세요!",
                              showKakao: true,
                            },
                            [],
                          );
                        },
                      },
                      {
                        label: "수령했는데 번호를 모르겠어요",
                        run: () => {
                          const uid = nextId("user");
                          setEntries((p) => [
                            ...p,
                            {
                              kind: "user",
                              id: uid,
                              text: "수령했는데 번호를 모르겠어요",
                            },
                          ]);
                          runBotReply(
                            {
                              text: "종이지갑 후면 좌측 하단에\n지갑 No가 적혀있어요 📄\n확인 후 다시 입력해보시고,\n그래도 안되시면 문의해주세요!",
                              showKakao: true,
                            },
                            [],
                          );
                        },
                      },
                      {
                        label: "아직 수령하지 않았어요",
                        run: () => {
                          const uid = nextId("user");
                          setEntries((p) => [
                            ...p,
                            {
                              kind: "user",
                              id: uid,
                              text: "아직 수령하지 않았어요",
                            },
                          ]);
                          runBotReply(
                            {
                              text: "개인정보 보호를 위해 지갑 수령 완료\n이후부터 조회가 가능해요.\n수령 절차가 궁금하시면 문의해주세요!",
                              showKakao: true,
                            },
                            [],
                          );
                        },
                      },
                    ],
                  );
                },
              },
              {
                label: "지갑 디자인과 No가 틀려요",
                run: () => {
                  const id = nextId("user");
                  setEntries((p) => [
                    ...p,
                    {
                      kind: "user",
                      id,
                      text: "지갑 디자인과 No가 틀려요",
                    },
                  ]);
                  runBotReply(
                    {
                      text: "지갑 정보가 맞지 않는 경우네요.\n카카오톡으로 문의해주시면\n확인해드릴게요!",
                      showKakao: true,
                    },
                    [],
                  );
                },
              },
            ],
          );
        },
      },
      {
        label: "고액권 전환 참여",
        run: () => {
          const u = nextId("user");
          setEntries((prev) => [
            ...prev,
            { kind: "user", id: u, text: "고액권 전환 참여" },
          ]);
          runBotReply(
            { text: "고액권을 춘심팀에 제출하셨나요?" },
            [
              {
                label: "네, 제출했어요",
                run: () => {
                  const uid = nextId("user");
                  setEntries((p) => [
                    ...p,
                    { kind: "user", id: uid, text: "네, 제출했어요" },
                  ]);
                  runBotReply(
                    {
                      text: "신청 시 작성하신 성함·연락처와 다를 경우\n조회가 안될 수 있어요.\n카카오톡으로 확인해주세요!",
                      showKakao: true,
                    },
                    [],
                  );
                },
              },
              {
                label: "아직 제출 안 했어요",
                run: () => {
                  const uid = nextId("user");
                  setEntries((p) => [
                    ...p,
                    { kind: "user", id: uid, text: "아직 제출 안 했어요" },
                  ]);
                  runBotReply(
                    {
                      text: "참여금(수수료 4%) 입금은 완료하셨나요?",
                    },
                    [
                      {
                        label: "네, 입금했어요",
                        run: () => {
                          const id2 = nextId("user");
                          setEntries((p) => [
                            ...p,
                            { kind: "user", id: id2, text: "네, 입금했어요" },
                          ]);
                          runBotReply(
                            {
                              text: "고액권 제출 및 지갑 수령 완료 이후부터\n조회가 가능해요.\n제출 절차가 궁금하시면 문의해주세요!",
                              showKakao: true,
                            },
                            [],
                          );
                        },
                      },
                      {
                        label: "아직 입금 전이에요",
                        run: () => {
                          const id2 = nextId("user");
                          setEntries((p) => [
                            ...p,
                            {
                              kind: "user",
                              id: id2,
                              text: "아직 입금 전이에요",
                            },
                          ]);
                          runBotReply(
                            {
                              text: "입금 → 고액권 제출 → 지갑 수령 완료\n이후부터 조회가 가능합니다 😊",
                            },
                            [],
                          );
                        },
                      },
                    ],
                  );
                },
              },
            ],
          );
        },
      },
      {
        label: "해당 없음 / 기타 문의",
        run: () => {
          const u = nextId("user");
          setEntries((prev) => [
            ...prev,
            { kind: "user", id: u, text: "해당 없음 / 기타 문의" },
          ]);
          runBotReply(
            {
              text: "다른 문의사항이 있으시군요!\n춘심이 동생에게 직접 문의해주시면\n빠르게 도와드릴게요 😊",
              showKakao: true,
            },
            [],
          );
        },
      },
    ];
  }, [runBotReply]);

  const beginConversation = useCallback(() => {
    genRef.current += 1;
    const g = genRef.current;
    clearTimers();
    setEntries([]);
    setChoices([]);
    setBusy(true);
    const typingId = nextId("typing");
    const botId = nextId("bot");

    const t1 = setTimeout(() => {
      if (g !== genRef.current) return;
      setEntries([{ kind: "typing", id: typingId }]);
      const t2 = setTimeout(() => {
        if (g !== genRef.current) return;
        setEntries([
          {
            kind: "bot",
            id: botId,
            text: GREETING_BOT.text,
            animate: true,
          },
        ]);
        setChoices(buildStartChoices());
        setBusy(false);
      }, TYPING_DURATION_MS);
      timersRef.current.push(t2);
    }, DELAY_BEFORE_TYPING_MS);
    timersRef.current.push(t1);
  }, [buildStartChoices, clearTimers]);

  useEffect(() => {
    if (!open) return;
    beginConversation();
    return () => {
      genRef.current += 1;
      clearTimers();
    };
  }, [open, beginConversation, clearTimers]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onKeyDown]);

  const handleReset = () => {
    beginConversation();
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <Overlay
        role="presentation"
        aria-hidden
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <Panel role="dialog" aria-modal="true" aria-label="춘심 도우미 문의">
        <HeaderBar>
          <HeaderLeft>
            <HeaderAvatar aria-hidden>C</HeaderAvatar>
            <HeaderTitle>춘심 도우미</HeaderTitle>
          </HeaderLeft>
          <HeaderActions>
            <TextGhostBtn type="button" onClick={handleReset}>
              처음부터 다시
            </TextGhostBtn>
            <IconBtn type="button" onClick={onClose} aria-label="닫기">
              <IconX size={22} color="currentColor" />
            </IconBtn>
          </HeaderActions>
        </HeaderBar>

        <MessagesViewport ref={scrollRef}>
          <MessagesColumn>
            {entries.map((e) => {
              if (e.kind === "user") {
                return (
                  <UserRow key={e.id}>
                    <UserBubble>{e.text}</UserBubble>
                  </UserRow>
                );
              }
              if (e.kind === "typing") {
                return (
                  <BotRow key={e.id}>
                    <BotAvatar aria-hidden>C</BotAvatar>
                    <TypingBubble aria-hidden>
                      <TypingDot $delay={0} />
                      <TypingDot $delay={0.2} />
                      <TypingDot $delay={0.4} />
                    </TypingBubble>
                  </BotRow>
                );
              }
              return (
                <BotRow key={e.id}>
                  <BotAvatar aria-hidden>C</BotAvatar>
                  <div style={{ minWidth: 0, maxWidth: "100%" }}>
                    <BotBubble $animate={e.animate}>{e.text}</BotBubble>
                    {e.showKakao || e.unresolvedHint ? (
                      <BotExtras>
                        {e.showKakao ? (
                          <KakaoBtn
                            href={SBMB_KAKAO_INQUIRY_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <IconMessageCircle size={16} color={T.kakaoText} />
                            카카오톡 문의
                          </KakaoBtn>
                        ) : null}
                        {e.unresolvedHint ? (
                          <UnresolvedHint>해결되지 않으셨나요?</UnresolvedHint>
                        ) : null}
                      </BotExtras>
                    ) : null}
                  </div>
                </BotRow>
              );
            })}
          </MessagesColumn>
        </MessagesViewport>

        {choices.length > 0 ? (
          <ChoicesDock>
            {choices.map((c, idx) => (
              <ChoiceBtn
                key={`${idx}-${c.label}`}
                type="button"
                $disabled={busy}
                onClick={() => {
                  if (busy) return;
                  c.run();
                }}
              >
                {c.label}
              </ChoiceBtn>
            ))}
          </ChoicesDock>
        ) : null}
      </Panel>
    </>,
    document.body,
  );
}
