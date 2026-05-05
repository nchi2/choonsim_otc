"use client";

import {
  Fragment,
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

const CHOICES_DELAY_MS = 600;

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

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
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
  height: 80vh;
  max-height: 80vh;
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

const HeaderAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
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
  align-items: flex-start;
  gap: 8px;
  max-width: 100%;
  align-self: flex-start;
`;

const BotAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  margin-top: 2px;
`;

const BotColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
  max-width: calc(100% - 40px);
`;

const BotBubble = styled.div<{ $animate?: boolean }>`
  max-width: 100%;
  min-width: 200px;
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

const ChoicePillRow = styled.div<{ $visible?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  align-items: flex-end;
  ${(p) =>
    p.$visible
      ? css`
          animation: ${fadeIn} 0.32s ease-out forwards;
        `
      : css`
          display: none;
        `}
`;

const ChoiceRow = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  margin-top: 8px;
`;

const ChoicePill = styled.button`
  display: inline-block;
  box-sizing: border-box;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #ffffff;
  cursor: pointer;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 500;
  font-size: 13px;
  color: #374151;
  text-align: center;
  transition:
    border-color 0.15s ease,
    color 0.15s ease;

  &:hover {
    border-color: #8fd8c7;
    color: #4c4598;
  }
`;

const BotExtras = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 100%;
`;

const KakaoGuide = styled.p`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 11px;
  color: #9ca3af;
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

const KakaoBtn = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fee500;
  border-radius: 12px;
  padding: 8px 14px;
  width: fit-content;
  min-width: 176px;
  max-width: 200px;
  margin-bottom: 8px;
  cursor: pointer;
  border: none;
  text-decoration: none;

  &:hover {
    filter: brightness(0.98);
  }
`;

const KakaoIconWrap = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #3c1e1e;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const KakaoText = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: #3c1e1e;
  line-height: 1.2;
`;

const UnresolvedHint = styled.p`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 13px;
  color: #6b7280;
  text-align: left;
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

type ChoiceItem = {
  label: string;
  execute: () => void;
};

type BotTurnEntry = {
  kind: "bot_turn";
  id: string;
  text: string;
  showKakao?: boolean;
  unresolvedHint?: boolean;
  animate?: boolean;
  choices?: ChoiceItem[];
  showChoices: boolean;
};

type UserEntry = { kind: "user"; id: string; text: string };

type ChatEntry = UserEntry | BotTurnEntry;

let idSeq = 0;
function nextId(prefix: string) {
  idSeq += 1;
  return `${prefix}-${idSeq}-${Date.now()}`;
}

const GREETING_TEXT = "참여 유형을 선택해주세요.";

export default function SbmbInquiryFlowModal({
  open,
  onClose,
}: SbmbInquiryFlowModalProps) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
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

  const scheduleRevealChoices = useCallback((botId: string, g: number) => {
    const t = setTimeout(() => {
      if (g !== genRef.current) return;
      setEntries((prev) =>
        prev.map((e) =>
          e.kind === "bot_turn" && e.id === botId
            ? { ...e, showChoices: true }
            : e,
        ),
      );
    }, CHOICES_DELAY_MS);
    timersRef.current.push(t);
  }, []);

  const runBotReply = useCallback(
    (payload: BotPayload, nextChoices: ChoiceItem[]) => {
      clearTimers();
      const g = genRef.current;
      const botId = nextId("bot");
      const hasChoices = nextChoices.length > 0;

      setEntries((prev) => [
        ...prev,
        {
          kind: "bot_turn",
          id: botId,
          text: payload.text,
          showKakao: payload.showKakao,
          unresolvedHint: payload.unresolvedHint,
          animate: true,
          choices: hasChoices ? nextChoices : undefined,
          showChoices: !hasChoices,
        },
      ]);

      if (hasChoices) {
        scheduleRevealChoices(botId, g);
      }
    },
    [clearTimers, scheduleRevealChoices],
  );

  const buildStartChoices = useCallback((): ChoiceItem[] => {
    return [
      {
        label: "10모 단위 참여",
        execute: () =>
          runBotReply({ text: "어떤 문제가 발생하셨나요?" }, [
            {
              label: "성함/연락처 조회가 안돼요",
              execute: () =>
                runBotReply(
                  {
                    text: "신청 당시 SBMB 참여 확인 문자를 수신하셨나요?",
                  },
                  [
                    {
                      label: "네, 받았어요",
                      execute: () =>
                        runBotReply(
                          {
                            text: "신청 시 작성하신 성함과 연락처가 다를 경우 조회가 되지 않습니다.\n카카오톡으로 문의를 남겨주세요.",
                            showKakao: true,
                            unresolvedHint: true,
                          },
                          [],
                        ),
                    },
                    {
                      label: "아니오, 못 받았어요",
                      execute: () =>
                        runBotReply(
                          {
                            text: "구글폼 미작성 상태에서 입금만 완료하신 미확인 참여자분들이 있습니다.\n카카오톡으로 문의를 남겨주세요.",
                            showKakao: true,
                          },
                          [],
                        ),
                    },
                    {
                      label: "해당 없음",
                      execute: () =>
                        runBotReply(
                          {
                            text: "카카오톡으로 문의를 남겨주세요.",
                            showKakao: true,
                          },
                          [],
                        ),
                    },
                  ],
                ),
            },
            {
              label: "지갑 No를 모르겠어요",
              execute: () =>
                runBotReply({ text: "지갑을 수령하셨나요?" }, [
                  {
                    label: "수령했는데 분실했어요",
                    execute: () =>
                      runBotReply(
                        {
                          text: "아직 SBMB 에어드랍 전이므로 교환이 가능합니다.\n카카오톡으로 문의를 남겨주세요.",
                          showKakao: true,
                        },
                        [],
                      ),
                  },
                  {
                    label: "수령했는데 번호를 모르겠어요",
                    execute: () =>
                      runBotReply(
                        {
                          text: "수령하신 종이지갑 후면 좌측 하단에 지갑 No가 기재되어 있습니다. 확인 후 다시 입력해주세요.",
                        },
                        [],
                      ),
                  },
                  {
                    label: "아직 수령하지 않았어요",
                    execute: () =>
                      runBotReply(
                        {
                          text: "개인정보 보호를 위해 지갑 수령 완료 이후부터 조회가 가능합니다.\n지갑 수령을 완료해주세요.",
                        },
                        [],
                      ),
                  },
                  {
                    label: "해당 없음",
                    execute: () =>
                      runBotReply(
                        {
                          text: "카카오톡으로 문의를 남겨주세요.",
                          showKakao: true,
                        },
                        [],
                      ),
                  },
                ]),
            },
            {
              label: "지갑 디자인과 No가 틀려요",
              execute: () =>
                runBotReply(
                  {
                    text: "구매 및 강의 참석으로 얻으신 지갑은 포함되지 않습니다.\nSBMB 신청으로 수령한 지갑의 디자인과 No가 다르다면\n카카오톡으로 문의를 남겨주세요.",
                    showKakao: true,
                  },
                  [],
                ),
            },
            {
              label: "해당 없음",
              execute: () =>
                runBotReply(
                  {
                    text: "카카오톡으로 문의를 남겨주세요.",
                    showKakao: true,
                  },
                  [],
                ),
            },
          ]),
      },
      {
        label: "고액권 전환 참여",
        execute: () =>
          runBotReply({ text: "고액권을 춘심팀에 제출하셨나요?" }, [
            {
              label: "네, 제출했어요",
              execute: () =>
                runBotReply(
                  {
                    text: "신청 시 작성하신 성함과 연락처가 다를 경우 조회가 되지 않습니다.\n카카오톡으로 문의를 남겨주세요.",
                    showKakao: true,
                  },
                  [],
                ),
            },
            {
              label: "아직 제출 안 했어요",
              execute: () =>
                runBotReply(
                  {
                    text: "참여금(수수료 4%) 입금을 완료하셨나요?",
                  },
                  [
                    {
                      label: "네, 입금했어요",
                      execute: () =>
                        runBotReply(
                          {
                            text: "고액권 제출 및 지갑 수령 완료 이후부터 조회가 가능합니다.\n추가 안내가 필요하시면 문의를 남겨주세요.",
                            showKakao: true,
                          },
                          [],
                        ),
                    },
                    {
                      label: "아직 입금 전이에요",
                      execute: () =>
                        runBotReply(
                          {
                            text: "입금 완료 및 고액권 제출, 지갑 수령 완료 이후부터 조회가 가능합니다.",
                          },
                          [],
                        ),
                    },
                    {
                      label: "해당 없음",
                      execute: () =>
                        runBotReply(
                          {
                            text: "카카오톡으로 문의를 남겨주세요.",
                            showKakao: true,
                          },
                          [],
                        ),
                    },
                  ],
                ),
            },
            {
              label: "해당 없음",
              execute: () =>
                runBotReply(
                  {
                    text: "카카오톡으로 문의를 남겨주세요.",
                    showKakao: true,
                  },
                  [],
                ),
            },
          ]),
      },
      {
        label: "해당 없음",
        execute: () =>
          runBotReply(
            {
              text: "카카오톡으로 문의를 남겨주세요.",
              showKakao: true,
            },
            [],
          ),
      },
    ];
  }, [runBotReply]);

  const beginConversation = useCallback(() => {
    genRef.current += 1;
    const g = genRef.current;
    clearTimers();
    const botId = nextId("bot");
    setEntries([
      {
        kind: "bot_turn",
        id: botId,
        text: GREETING_TEXT,
        animate: true,
        choices: buildStartChoices(),
        showChoices: false,
      },
    ]);
    scheduleRevealChoices(botId, g);
  }, [buildStartChoices, clearTimers, scheduleRevealChoices]);

  useEffect(() => {
    if (!open) return;
    const bootTimer = setTimeout(() => {
      beginConversation();
    }, 0);
    return () => {
      clearTimeout(bootTimer);
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

  const handleChoicePick = useCallback(
    (botTurnId: string, choice: ChoiceItem) => {
      const uid = nextId("user");
      setEntries((prev) => {
        const cleared = prev.map((e) =>
          e.kind === "bot_turn" && e.id === botTurnId
            ? { ...e, choices: undefined, showChoices: false }
            : e,
        );
        return [...cleared, { kind: "user", id: uid, text: choice.label }];
      });
      choice.execute();
    },
    [],
  );

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
            <HeaderAvatar
              src="/choonsim_sbmb_cs_character.png"
              alt=""
              aria-hidden
            />
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

              const pills =
                e.choices && e.choices.length > 0 ? (
                  <ChoicePillRow $visible={e.showChoices}>
                    {e.choices.map((c, idx) => (
                      <ChoicePill
                        key={`${e.id}-${idx}-${c.label}`}
                        type="button"
                        onClick={() => handleChoicePick(e.id, c)}
                      >
                        {c.label}
                      </ChoicePill>
                    ))}
                  </ChoicePillRow>
                ) : null;

              return (
                <Fragment key={e.id}>
                  <BotRow>
                    <BotAvatar
                      src="/choonsim_sbmb_cs_character.png"
                      alt=""
                      aria-hidden
                    />
                    <BotColumn>
                      <BotBubble $animate={e.animate}>{e.text}</BotBubble>
                      {e.showKakao || e.unresolvedHint ? (
                        <BotExtras>
                          {e.showKakao ? (
                            <>
                              <KakaoGuide>
                                해당 안내는 EVM 지갑 수령자 전용 안내입니다.
                              </KakaoGuide>
                              <KakaoBtn
                                href={SBMB_KAKAO_INQUIRY_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <KakaoIconWrap>
                                  <IconMessageCircle
                                    size={18}
                                    color="#ffffff"
                                  />
                                </KakaoIconWrap>
                                <KakaoText>카카오톡 연결하기</KakaoText>
                              </KakaoBtn>
                            </>
                          ) : null}
                          {e.unresolvedHint ? (
                            <UnresolvedHint>
                              해결되지 않으셨다면 카카오톡으로 문의해주세요.
                            </UnresolvedHint>
                          ) : null}
                        </BotExtras>
                      ) : null}
                    </BotColumn>
                  </BotRow>
                  {pills ? <ChoiceRow>{pills}</ChoiceRow> : null}
                </Fragment>
              );
            })}
          </MessagesColumn>
        </MessagesViewport>
      </Panel>
    </>,
    document.body,
  );
}
