"use client";

// /mypage — 내 정보·신청내역. 미들웨어가 비로그인은 /login으로 보냄(이중 안전: 여기서도 처리).
// 프로필(이름·전화 수정, 구글 회원 전화 보완 유도)·이메일 인증 배지+재발송·내 신청내역·교육자 placeholder.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import { eduColors, eduLayout, media } from "@/components/education/tokens";
import { formatPhone } from "@/lib/format-phone";
import { useMemberSession } from "@/lib/member-client";

const Wrap = styled.div`
  max-width: 720px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  margin: 0 0 1.25rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

const Card = styled.section`
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.surface};
  padding: 1.25rem 1.4rem;
  margin-bottom: 1.1rem;
`;

const CardTitle = styled.h2`
  margin: 0 0 0.9rem;
  font-size: 1rem;
  font-weight: 800;
  color: ${eduColors.text};
`;

const Field = styled.label`
  display: block;
  margin-bottom: 0.8rem;
`;

const FieldLabel = styled.span`
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${eduColors.textMuted};
  margin-bottom: 0.3rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${eduColors.borderInput};
  border-radius: 8px;
  font-size: 0.9rem;
  background: ${eduColors.surface};
  color: ${eduColors.text};
  &:read-only {
    background: ${eduColors.bg};
    color: ${eduColors.textMuted};
  }
  &:focus {
    outline: none;
    border-color: ${eduColors.primary};
  }
`;

const Btn = styled.button`
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: none;
  background: ${eduColors.primary};
  color: ${eduColors.white};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${eduColors.primaryHover};
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Msg = styled.span<{ $error?: boolean }>`
  margin-left: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${(p) => (p.$error ? eduColors.danger : eduColors.success)};
`;

const VerifyBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  padding: 0.7rem 0.9rem;
  border-radius: 9px;
  background: ${eduColors.warnSoft};
  border: 1px solid #fde68a;
  color: ${eduColors.warn};
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.9rem;

  button {
    margin-left: auto;
    padding: 0.35rem 0.7rem;
    border-radius: 7px;
    border: 1px solid ${eduColors.warn}55;
    background: ${eduColors.surface};
    color: ${eduColors.warn};
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
`;

const HintNote = styled.p`
  margin: 0 0 0.7rem;
  font-size: 0.78rem;
  color: ${eduColors.primaryText};
  background: ${eduColors.primarySoft};
  border: 1px solid ${eduColors.primaryBorder};
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
  line-height: 1.5;
`;

const AppList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const AppRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid ${eduColors.border};
  border-radius: 10px;
  text-decoration: none;
  color: inherit;

  &:hover {
    border-color: ${eduColors.primaryBorder};
    background: ${eduColors.primarySofter};
  }

  .body {
    min-width: 0;
    flex: 1;
    .t {
      font-weight: 700;
      color: ${eduColors.text};
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sub {
      margin-top: 0.15rem;
      font-size: 0.76rem;
      color: ${eduColors.textMuted};
    }
  }
`;

const Chip = styled.span<{ $tone: "green" | "gray" | "amber" }>`
  flex-shrink: 0;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  ${(p) =>
    p.$tone === "green"
      ? `background:${eduColors.successSoft};color:${eduColors.success};`
      : p.$tone === "amber"
        ? `background:${eduColors.warnSoft};color:${eduColors.warn};`
        : `background:${eduColors.bg};color:${eduColors.textMuted};`}
`;

const Empty = styled.p`
  margin: 0;
  padding: 1.5rem 1rem;
  text-align: center;
  color: ${eduColors.textFaint};
  font-size: 0.85rem;
`;

const EducatorBox = styled.div`
  padding: 1.1rem;
  border: 1px dashed ${eduColors.primaryBorder};
  border-radius: 10px;
  background: ${eduColors.primarySofter};

  p {
    margin: 0 0 0.6rem;
    font-size: 0.84rem;
    color: ${eduColors.textSub};
    line-height: 1.55;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${eduColors.borderInput};
  border-radius: 8px;
  font-size: 0.88rem;
  min-height: 72px;
  resize: vertical;
  background: ${eduColors.surface};
  color: ${eduColors.text};
  &:focus {
    outline: none;
    border-color: ${eduColors.primary};
  }
`;

const StatusPill = styled.span<{ $tone: "amber" | "green" | "red" }>`
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
  ${(p) =>
    p.$tone === "green"
      ? `background:${eduColors.successSoft};color:${eduColors.success};`
      : p.$tone === "amber"
        ? `background:${eduColors.warnSoft};color:${eduColors.warn};`
        : `background:${eduColors.dangerSoft};color:${eduColors.danger};`}
`;

const HostedRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid ${eduColors.border};
  border-radius: 9px;
  margin-bottom: 0.5rem;
  text-decoration: none;
  color: inherit;
  font-size: 0.84rem;

  &:hover {
    border-color: ${eduColors.primaryBorder};
  }

  .t {
    flex: 1;
    min-width: 0;
    font-weight: 700;
    color: ${eduColors.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .n {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: ${eduColors.textMuted};
  }
`;

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
function fmtSession(s: { date: string; startTime: string } | null): string {
  if (!s) return "일정 미정";
  const wd = WEEKDAY[new Date(`${s.date}T00:00:00+09:00`).getDay()];
  return `${Number(s.date.slice(5, 7))}/${Number(s.date.slice(8, 10))}(${wd}) ${s.startTime}`;
}

interface AppItem {
  id: number;
  status: string;
  createdAt: string;
  paid: boolean;
  attended: boolean;
  session: { date: string; startTime: string; endTime: string } | null;
  eventTitle: string;
  eventSlug: string;
  feeKrw: number;
  locationName: string | null;
}

interface HostedItem {
  id: number;
  title: string;
  slug: string;
  status: string;
  isPublished: boolean;
  rejectReason: string | null;
  firstSession: { date: string; startTime: string } | null;
  applicationCount: number;
}

/** 교육자 섹션 — 상태별: NONE 신청폼 / PENDING 검토중 / APPROVED 개설링크+내 강의 / REJECTED 사유+재신청 */
function EducatorSection({
  status,
  rejectReason,
  onChanged,
}: {
  status: string;
  rejectReason: string | null;
  onChanged: () => void;
}) {
  const [intro, setIntro] = useState("");
  const [plan, setPlan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hosted, setHosted] = useState<HostedItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (status === "APPROVED") {
      void fetch("/api/member/hosted-events")
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((j) => {
          if (!cancelled) setHosted(j.items ?? []);
        })
        .catch(() => {
          if (!cancelled) setHosted([]);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [status]);

  const apply = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/member/educator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intro: intro.trim() || null, plan: plan.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "신청에 실패했습니다.");
      onChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "신청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "PENDING") {
    return (
      <EducatorBox>
        <p>
          <StatusPill $tone="amber">검토 중</StatusPill>
        </p>
        <p>
          교육자 신청을 검토하고 있어요. 결과는 이메일로 안내드립니다.
        </p>
      </EducatorBox>
    );
  }

  if (status === "APPROVED") {
    return (
      <div>
        <p style={{ margin: "0 0 0.7rem" }}>
          <StatusPill $tone="green">승인된 교육자</StatusPill>
        </p>
        <div style={{ marginBottom: "1rem" }}>
          <Btn as={Link} href="/host" style={{ textDecoration: "none", display: "inline-block" }}>
            행사 개설하기 →
          </Btn>
        </div>
        <CardTitle as="h3" style={{ fontSize: "0.9rem" }}>
          내가 연 강의
        </CardTitle>
        {hosted == null ? (
          <Empty>불러오는 중…</Empty>
        ) : hosted.length === 0 ? (
          <Empty>아직 개설한 행사가 없습니다.</Empty>
        ) : (
          hosted.map((h) => (
            <HostedRow key={h.id} href={`/events/${h.slug}`}>
              <span className="t">{h.title}</span>
              {h.status === "PENDING" ? (
                <StatusPill $tone="amber">검토 중</StatusPill>
              ) : h.status === "APPROVED" ? (
                <StatusPill $tone="green">{h.isPublished ? "공개 중" : "승인(비공개)"}</StatusPill>
              ) : (
                <StatusPill $tone="red">반려</StatusPill>
              )}
              <span className="n">신청 {h.applicationCount}명</span>
            </HostedRow>
          ))
        )}
      </div>
    );
  }

  // NONE 또는 REJECTED — 신청 폼(재신청 포함)
  return (
    <EducatorBox>
      {status === "REJECTED" ? (
        <p>
          <StatusPill $tone="red">반려됨</StatusPill>
          {rejectReason ? ` 사유: ${rejectReason}` : null}
        </p>
      ) : null}
      <p>
        강의·워크숍을 직접 열고 싶으신가요? 교육자로 신청하면 운영팀 승인 후 행사를
        개설할 수 있습니다.
      </p>
      <Field>
        <FieldLabel>강사 소개 (선택)</FieldLabel>
        <Textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="어떤 주제를 가르쳐 오셨나요?"
        />
      </Field>
      <Field>
        <FieldLabel>활동 계획 (선택)</FieldLabel>
        <Textarea
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          placeholder="어떤 강의·행사를 열고 싶으신가요?"
        />
      </Field>
      {err ? <Msg $error>{err}</Msg> : null}
      <div style={{ marginTop: "0.6rem" }}>
        <Btn type="button" disabled={submitting} onClick={() => void apply()}>
          {submitting ? "신청 중…" : status === "REJECTED" ? "다시 신청하기" : "교육자 신청하기"}
        </Btn>
      </div>
    </EducatorBox>
  );
}

export default function MyPage() {
  const router = useRouter();
  const { member, loaded, refresh } = useMemberSession();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const [apps, setApps] = useState<AppItem[] | null>(null);

  // 미로그인이면 로그인으로(미들웨어와 이중 안전)
  useEffect(() => {
    if (loaded && !member) router.replace("/login?next=/mypage");
  }, [loaded, member, router]);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setPhone(member.phone ?? "");
    }
  }, [member]);

  useEffect(() => {
    let cancelled = false;
    if (member) {
      void fetch("/api/member/applications")
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((j) => {
          if (!cancelled) setApps(j.items ?? []);
        })
        .catch(() => {
          if (!cancelled) setApps([]);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [member]);

  const saveProfile = useCallback(async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "저장 실패");
      await refresh();
      setProfileMsg({ text: "저장되었습니다." });
    } catch (e) {
      setProfileMsg({
        text: e instanceof Error ? e.message : "저장에 실패했습니다.",
        error: true,
      });
    } finally {
      setSavingProfile(false);
    }
  }, [name, phone, refresh]);

  const resendVerification = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      const res = await fetch("/api/member/auth/resend-verification", {
        method: "POST",
      });
      const json = await res.json();
      if (res.status === 429) {
        setResendMsg("잠시 후 다시 시도해 주세요.");
      } else if (!res.ok || !json.ok) {
        setResendMsg(json.error || "발송에 실패했습니다.");
      } else {
        setResendMsg("인증 메일을 다시 보냈습니다.");
      }
    } catch {
      setResendMsg("발송에 실패했습니다.");
    } finally {
      setResending(false);
    }
  };

  if (!loaded || !member) {
    return (
      <PublicShell showTicker={false}>
        <Wrap>
          <Empty>불러오는 중…</Empty>
        </Wrap>
      </PublicShell>
    );
  }

  const isGoogleNoPhone = member.provider === "google" && !member.phone;

  return (
    <PublicShell showTicker={false}>
      <Wrap>
        <PageTitle>마이페이지</PageTitle>

        {member.emailVerifiedAt == null ? (
          <VerifyBanner>
            이메일 인증이 완료되지 않았습니다. 받은 메일의 링크를 눌러주세요.
            <button type="button" disabled={resending} onClick={resendVerification}>
              {resending ? "발송 중…" : "인증 메일 재발송"}
            </button>
            {resendMsg ? (
              <span style={{ width: "100%", fontWeight: 600 }}>{resendMsg}</span>
            ) : null}
          </VerifyBanner>
        ) : null}

        {/* 프로필 */}
        <Card>
          <CardTitle>내 정보</CardTitle>
          {isGoogleNoPhone ? (
            <HintNote>
              전화번호가 아직 등록되지 않았어요. 행사 안내를 받으시려면 전화번호를
              입력해 주세요.
            </HintNote>
          ) : null}
          <Field>
            <FieldLabel>이메일</FieldLabel>
            <Input value={member.email} readOnly />
          </Field>
          <Field>
            <FieldLabel>이름</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>전화번호</FieldLabel>
            <Input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              inputMode="tel"
              placeholder="010-0000-0000"
            />
          </Field>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Btn
              type="button"
              disabled={savingProfile || !name.trim()}
              onClick={() => void saveProfile()}
            >
              {savingProfile ? "저장 중…" : "저장"}
            </Btn>
            {profileMsg ? (
              <Msg $error={profileMsg.error}>{profileMsg.text}</Msg>
            ) : null}
          </div>
        </Card>

        {/* 내 신청 내역 */}
        <Card>
          <CardTitle>내 신청 내역</CardTitle>
          {apps == null ? (
            <Empty>불러오는 중…</Empty>
          ) : apps.length === 0 ? (
            <Empty>아직 신청한 행사가 없습니다.</Empty>
          ) : (
            <AppList>
              {apps.map((a) => (
                <AppRow key={a.id} href={`/events/${a.eventSlug}`}>
                  <div className="body">
                    <div className="t">{a.eventTitle}</div>
                    <div className="sub">
                      {fmtSession(a.session)}
                      {a.locationName ? ` · ${a.locationName}` : ""}
                    </div>
                  </div>
                  {a.status === "CANCELED" ? (
                    <Chip $tone="gray">취소</Chip>
                  ) : (
                    <Chip $tone="green">신청완료</Chip>
                  )}
                  {a.feeKrw > 0 ? (
                    <Chip $tone={a.paid ? "green" : "amber"}>
                      {a.paid ? "입금확인" : "입금대기"}
                    </Chip>
                  ) : null}
                </AppRow>
              ))}
            </AppList>
          )}
        </Card>

        {/* 교육자 — 신청·상태·내가 연 강의 (B-3 배선) */}
        <Card>
          <CardTitle>교육자</CardTitle>
          <EducatorSection
            status={member.educatorStatus}
            rejectReason={member.educatorRejectReason}
            onChanged={() => void refresh()}
          />
        </Card>
      </Wrap>
    </PublicShell>
  );
}
