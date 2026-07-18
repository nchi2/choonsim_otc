"use client";

// /mypage — 내 정보·신청내역. 미들웨어가 비로그인은 /login으로 보냄(이중 안전: 여기서도 처리).
// 프로필(이름·전화 수정, 구글 회원 전화 보완 유도)·이메일 인증 배지+재발송·내 신청내역·교육자 placeholder.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import { eduColors, eduLayout, media } from "@/components/education/tokens";
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
              onChange={(e) => setPhone(e.target.value)}
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

        {/* 교육자 — placeholder (B-3에서 신청·승인 배선) */}
        <Card>
          <CardTitle>교육자</CardTitle>
          <EducatorBox>
            <p>
              강의·워크숍을 직접 열고 싶으신가요? 교육자로 신청하면 운영팀 승인 후
              행사를 개설할 수 있습니다.
            </p>
            <p style={{ color: eduColors.textFaint, fontSize: "0.78rem" }}>
              교육자 신청 기능은 곧 제공될 예정입니다.
            </p>
          </EducatorBox>
        </Card>
      </Wrap>
    </PublicShell>
  );
}
