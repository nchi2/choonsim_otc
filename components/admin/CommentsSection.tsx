"use client";

// 신청 상세 하단 운영자 코멘트 스레드 — 10모/OTC 공용.
// 마운트 시 목록 조회 + 읽음 처리(markRead=1). 본인 코멘트만 수정/삭제.

import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { adminColors } from "@/components/admin/ui";

const Card = styled.section`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: #fff;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${adminColors.textSub};
  margin: 0 0 0.75rem;
`;

const List = styled.ul`
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Item = styled.li`
  border: 1px solid ${adminColors.rowDivider};
  border-radius: 10px;
  background: ${adminColors.bgSubtle};
  padding: 0.7rem 0.85rem;
`;

const ItemHead = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
`;

const Author = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${adminColors.text};
`;

const TimeText = styled.span`
  font-size: 0.72rem;
  color: ${adminColors.textFaint};
`;

const HeadActions = styled.span`
  margin-left: auto;
  display: inline-flex;
  gap: 0.35rem;
`;

const MiniBtn = styled.button<{ $danger?: boolean }>`
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  border: 1px solid
    ${(p) => (p.$danger ? adminColors.dangerBorder : adminColors.borderInput)};
  background: #fff;
  color: ${(p) => (p.$danger ? adminColors.danger : adminColors.textSub)};
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Body = styled.p`
  margin: 0;
  font-size: 0.87rem;
  color: ${adminColors.text};
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 72px;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  font-size: 0.88rem;
  font-family: inherit;
  background: #fff;
  resize: vertical;
`;

const FootRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.5rem;
`;

const SubmitBtn = styled.button`
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  border: none;
  background: ${adminColors.primary};
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Msg = styled.span<{ $error?: boolean }>`
  font-size: 0.78rem;
  font-weight: 600;
  color: ${(p) => (p.$error ? adminColors.danger : adminColors.textMuted)};
`;

const EmptyText = styled.p`
  margin: 0 0 1rem;
  font-size: 0.82rem;
  color: ${adminColors.textFaint};
`;

interface CommentItem {
  id: number;
  createdAt: string;
  editedAt: string | null;
  authorId: number | null;
  authorName: string;
  body: string;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentsSection({
  targetType,
  targetId,
}: {
  targetType: "MIRACLE10" | "OTC_REQUEST";
  targetId: number;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [myId, setMyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editInput, setEditInput] = useState("");

  const load = useCallback(
    async (markRead: boolean) => {
      try {
        const res = await fetch(
          `/api/admin/comments?targetType=${targetType}&targetId=${targetId}${
            markRead ? "&markRead=1" : ""
          }`,
        );
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "코멘트를 불러오지 못했습니다.");
        }
        setComments(json.comments);
        setMyId(json.myAdminUserId ?? null);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [targetType, targetId],
  );

  // 상세 열람 = 이 시점까지 읽음 처리
  useEffect(() => {
    load(true);
  }, [load]);

  const submit = async () => {
    const body = input.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "작성 실패");
      setInput("");
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "작성에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id: number) => {
    const body = editInput.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "수정 실패");
      setEditingId(null);
      await load(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (busy || !window.confirm("코멘트를 삭제할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "삭제 실패");
      await load(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <SectionTitle>운영자 코멘트 ({comments.length})</SectionTitle>

      {loading ? (
        <EmptyText>불러오는 중…</EmptyText>
      ) : comments.length === 0 ? (
        <EmptyText>아직 코멘트가 없습니다. 첫 코멘트를 남겨보세요.</EmptyText>
      ) : (
        <List>
          {comments.map((c) => (
            <Item key={c.id}>
              <ItemHead>
                <Author>{c.authorName}</Author>
                <TimeText>
                  {fmtTime(c.createdAt)}
                  {c.editedAt ? " · 수정됨" : ""}
                </TimeText>
                {myId != null && c.authorId === myId ? (
                  <HeadActions>
                    {editingId === c.id ? null : (
                      <>
                        <MiniBtn
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(c.id);
                            setEditInput(c.body);
                          }}
                        >
                          수정
                        </MiniBtn>
                        <MiniBtn
                          type="button"
                          $danger
                          disabled={busy}
                          onClick={() => remove(c.id)}
                        >
                          삭제
                        </MiniBtn>
                      </>
                    )}
                  </HeadActions>
                ) : null}
              </ItemHead>
              {editingId === c.id ? (
                <>
                  <TextArea
                    value={editInput}
                    onChange={(e) => setEditInput(e.target.value)}
                    maxLength={2000}
                  />
                  <FootRow>
                    <SubmitBtn
                      type="button"
                      disabled={busy || !editInput.trim()}
                      onClick={() => saveEdit(c.id)}
                    >
                      저장
                    </SubmitBtn>
                    <MiniBtn
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingId(null)}
                    >
                      취소
                    </MiniBtn>
                  </FootRow>
                </>
              ) : (
                <Body>{c.body}</Body>
              )}
            </Item>
          ))}
        </List>
      )}

      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="이 신청 건에 대한 메모·인수인계를 남기세요"
        maxLength={2000}
      />
      <FootRow>
        <SubmitBtn
          type="button"
          disabled={busy || !input.trim()}
          onClick={submit}
        >
          {busy ? "처리 중…" : "코멘트 등록"}
        </SubmitBtn>
        {error ? <Msg $error>{error}</Msg> : null}
      </FootRow>
    </Card>
  );
}
