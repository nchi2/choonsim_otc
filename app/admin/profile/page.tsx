"use client";

// 내 프로필 — 1덩이 API 사용: GET/PATCH /api/admin/profile, POST /api/admin/profile/password.
// 정산 계좌는 본인 전용(세션 uid) — 다른 운영자에게 보이지 않는다.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { addDaysKstYmd, todayKst } from "@/lib/kst";
import { adminColors } from "@/components/admin/ui";
import { ErrorState, Skeleton } from "@/components/admin/States";
import { useAdminData } from "@/lib/admin-data";
import {
  DASHBOARD_KEY,
  DASHBOARD_TTL,
  MYSLOTS_TTL,
  dashboardFetcher,
  myslotsFetcher,
  myslotsKey,
  type DashboardData,
} from "@/lib/admin-fetchers";

const Page = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1rem 1.5rem;

  @media (min-width: 768px) {
    padding: 0 1.5rem 2rem;
  }
`;

const Card = styled.section`
  border: 1px solid ${adminColors.border};
  border-radius: 12px;
  background: ${adminColors.white};
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${adminColors.textSub};
  margin: 0 0 0.35rem;
`;

const SectionSub = styled.p`
  font-size: 0.78rem;
  color: ${adminColors.textMuted};
  margin: 0 0 0.9rem;
  line-height: 1.5;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
  margin-bottom: 0.3rem;
`;

const FieldHint = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.72rem;
  color: ${adminColors.textFaint};
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${adminColors.borderInput};
  border-radius: 8px;
  font-size: 0.9rem;
  background: ${adminColors.white};

  &:read-only {
    background: ${adminColors.bgSubtle};
    color: ${adminColors.textMuted};
  }
`;

const MaskedBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${adminColors.border};
  border-radius: 8px;
  background: ${adminColors.bgSubtle};
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  color: ${adminColors.text};
`;

const SmallBtn = styled.button`
  flex-shrink: 0;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  border: 1px solid ${adminColors.borderInput};
  background: ${adminColors.white};
  color: ${adminColors.textSub};
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: ${adminColors.bgSubtle};
  }
`;

const AlertFieldset = styled.div`
  margin-top: 1rem;
  padding-top: 0.9rem;
  border-top: 1px solid ${adminColors.rowDivider};
`;

const AlertLegend = styled.p`
  margin: 0 0 0.15rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${adminColors.textMuted};
`;

const AlertHint = styled.p`
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  color: ${adminColors.textFaint};
  line-height: 1.5;
`;

const AlertCheck = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0;
  font-size: 0.88rem;
  color: ${adminColors.textSub};
  cursor: pointer;

  input {
    width: 1.05rem;
    height: 1.05rem;
    accent-color: ${adminColors.primary};
    cursor: pointer;
  }
`;

const SaveRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.9rem;
`;

const SaveBtn = styled.button`
  padding: 0.55rem 1.2rem;
  border-radius: 8px;
  border: none;
  background: ${adminColors.primary};
  color: ${adminColors.white};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Msg = styled.span<{ $error?: boolean }>`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${(p) => (p.$error ? adminColors.danger : adminColors.successStrong)};
`;

const ScheduleList = styled.ul`
  list-style: none;
  margin: 0 0 0.75rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const ScheduleItem = styled.li`
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid ${adminColors.rowDivider};
  border-radius: 10px;
  background: ${adminColors.successSoft};
  font-size: 0.86rem;

  strong {
    color: ${adminColors.success};
    font-variant-numeric: tabular-nums;
  }
`;

const SlotSummaryLine = styled.p`
  margin: 0.15rem 0;
  font-size: 0.84rem;
  color: ${adminColors.textSub};
`;

const EmptyLine = styled.p`
  margin: 0 0 0.5rem;
  font-size: 0.84rem;
  color: ${adminColors.textFaint};
`;

const FootLink = styled(Link)`
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${adminColors.primary};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

interface Profile {
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankAccountHolder: string | null;
  alertMiracle10: boolean;
  alertOtc: boolean;
  alertEducation: boolean;
  /** role 분기용(읽기 전용) — Step 28 */
  manageOtc: boolean;
  manageEducation: boolean;
}

/** 계좌번호 마스킹 — 앞 6자리만 노출, 이후 숫자는 *, 구분자는 유지. */
function maskAccountNo(no: string): string {
  let shown = 0;
  return no
    .split("")
    .map((ch) => {
      if (!/[0-9a-zA-Z]/.test(ch)) return ch;
      shown += 1;
      return shown <= 6 ? ch : "*";
    })
    .join("");
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 내 정보 폼
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alertMiracle10, setAlertMiracle10] = useState(true);
  const [alertOtc, setAlertOtc] = useState(true);
  const [alertEducation, setAlertEducation] = useState(true);
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // 정산 계좌 폼
  const [bankName, setBankName] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [accountRevealed, setAccountRevealed] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // 비밀번호 폼
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // 오늘 일정(dashboard 캐시 공유) + 내 근무 슬롯(확장 work-slots API 1회, 캐시)
  const dashboard = useAdminData<DashboardData>(
    DASHBOARD_KEY,
    dashboardFetcher,
    { ttl: DASHBOARD_TTL },
  );
  const today = dashboard.data?.todayMySchedule ?? null;

  const weekFrom = todayKst();
  const weekTo = addDaysKstYmd(weekFrom, 7);
  const myslots = useAdminData<
    { date: string; startTime: string; officeName: string }[]
  >(myslotsKey(weekFrom), myslotsFetcher(weekFrom, weekTo), {
    ttl: MYSLOTS_TTL,
  });

  const slotSummary = useMemo(() => {
    if (myslots.data == null) return null;
    const byKey = new Map<string, number>();
    for (const s of myslots.data) {
      const k = `${s.date} · ${s.officeName}`;
      byKey.set(k, (byKey.get(k) ?? 0) + 1);
    }
    return [...byKey.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, n]) => `${k} — ${n}슬롯`);
  }, [myslots.data]);

  const applyProfile = useCallback((p: Profile) => {
    setProfile(p);
    setDisplayName(p.displayName);
    setEmail(p.email ?? "");
    setPhone(p.phone ?? "");
    setAlertMiracle10(p.alertMiracle10);
    setAlertOtc(p.alertOtc);
    setAlertEducation(p.alertEducation);
    setBankName(p.bankName ?? "");
    setBankHolder(p.bankAccountHolder ?? "");
    setBankAccountNo(p.bankAccountNo ?? "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/profile");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "프로필을 불러오지 못했습니다.");
        }
        if (!cancelled) applyProfile(json.profile);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, applyProfile]);

  const saveInfo = async () => {
    if (infoSaving) return;
    setInfoSaving(true);
    setInfoMsg(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          // ★ 화면에 보이는 알림 토글만 전송(Step 28) — API는 "요청에 없으면 미변경"이라
          //   role상 안 보이는 플래그가 임의로 꺼지는 일이 없다.
          ...(profile?.manageOtc ? { alertMiracle10, alertOtc } : {}),
          ...(profile?.manageEducation ? { alertEducation } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "저장 실패");
      applyProfile(json.profile);
      setInfoMsg({ text: "저장되었습니다." });
    } catch (e) {
      setInfoMsg({
        text: e instanceof Error ? e.message : "저장에 실패했습니다.",
        error: true,
      });
    } finally {
      setInfoSaving(false);
    }
  };

  const saveBank = async () => {
    if (bankSaving) return;
    setBankSaving(true);
    setBankMsg(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankName.trim() || null,
          bankAccountHolder: bankHolder.trim() || null,
          bankAccountNo: bankAccountNo.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "저장 실패");
      applyProfile(json.profile);
      setAccountRevealed(false);
      setBankMsg({ text: "저장되었습니다." });
    } catch (e) {
      setBankMsg({
        text: e instanceof Error ? e.message : "저장에 실패했습니다.",
        error: true,
      });
    } finally {
      setBankSaving(false);
    }
  };

  const changePassword = async () => {
    if (pwSaving) return;
    setPwMsg(null);
    if (newPw.length < 8) {
      setPwMsg({ text: "새 비밀번호는 8자 이상이어야 합니다.", error: true });
      return;
    }
    if (newPw !== newPw2) {
      setPwMsg({ text: "새 비밀번호가 서로 일치하지 않습니다.", error: true });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "변경 실패");
      setCurPw("");
      setNewPw("");
      setNewPw2("");
      setPwMsg({ text: "비밀번호가 변경되었습니다." });
    } catch (e) {
      setPwMsg({
        text: e instanceof Error ? e.message : "변경에 실패했습니다.",
        error: true,
      });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <Skeleton variant="card" count={3} />
      </Page>
    );
  }
  if (error || !profile) {
    return (
      <Page>
        <ErrorState message={error ?? undefined} />
      </Page>
    );
  }

  return (
    <Page>
      <Card>
        <SectionTitle>내 정보</SectionTitle>
        <FieldGrid>
          <div>
            <FieldLabel htmlFor="p-username">아이디</FieldLabel>
            <TextInput id="p-username" value={profile.username} readOnly />
          </div>
          <div>
            <FieldLabel htmlFor="p-name">표시 이름</FieldLabel>
            <TextInput
              id="p-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="p-email">이메일</FieldLabel>
            <TextInput
              id="p-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="예: me@example.com"
            />
            <FieldHint>신청 알림 메일이 이 주소로 발송됩니다.</FieldHint>
          </div>
          <div>
            <FieldLabel htmlFor="p-phone">연락처</FieldLabel>
            <TextInput
              id="p-phone"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="예: 010-0000-0000"
            />
          </div>
        </FieldGrid>
        <AlertFieldset>
          <AlertLegend>알림 수신 종류</AlertLegend>
          <AlertHint>
            체크한 종류의 신규 신청이 들어오면 이메일로 알려드립니다. (이메일이
            비어 있으면 발송되지 않습니다.)
          </AlertHint>
          {/* Step 28: role에 맞는 종류만 노출 — OTC 스코프 없는 운영자에게 OTC 알림 숨김 */}
          {profile.manageOtc ? (
            <>
              <AlertCheck>
                <input
                  type="checkbox"
                  checked={alertMiracle10}
                  onChange={(e) => setAlertMiracle10(e.target.checked)}
                />
                10모의 기적 신청 알림
              </AlertCheck>
              <AlertCheck>
                <input
                  type="checkbox"
                  checked={alertOtc}
                  onChange={(e) => setAlertOtc(e.target.checked)}
                />
                BMB 구매·판매(OTC) 신청 알림
              </AlertCheck>
            </>
          ) : null}
          {profile.manageEducation ? (
            <AlertCheck>
              <input
                type="checkbox"
                checked={alertEducation}
                onChange={(e) => setAlertEducation(e.target.checked)}
              />
              교육 알림 (행사 개설·수강 신청 등)
            </AlertCheck>
          ) : null}
        </AlertFieldset>
        <SaveRow>
          <SaveBtn
            type="button"
            disabled={infoSaving || !displayName.trim()}
            onClick={saveInfo}
          >
            {infoSaving ? "저장 중…" : "저장"}
          </SaveBtn>
          {infoMsg ? <Msg $error={infoMsg.error}>{infoMsg.text}</Msg> : null}
        </SaveRow>
      </Card>

      <Card>
        <SectionTitle>정산 계좌</SectionTitle>
        <SectionSub>
          정산·급여 지급용 계좌입니다. <strong>본인 외에는 누구에게도 보이지
          않으며</strong>, 다른 운영자·목록·조회 화면 어디에도 노출되지
          않습니다.
        </SectionSub>
        <FieldGrid>
          <div>
            <FieldLabel htmlFor="p-bank">은행명</FieldLabel>
            <TextInput
              id="p-bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="예: 국민은행"
            />
          </div>
          <div>
            <FieldLabel htmlFor="p-holder">예금주</FieldLabel>
            <TextInput
              id="p-holder"
              value={bankHolder}
              onChange={(e) => setBankHolder(e.target.value)}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldLabel htmlFor="p-account">계좌번호</FieldLabel>
            {accountRevealed ? (
              <MaskedBox as="div" style={{ background: adminColors.white }}>
                <TextInput
                  id="p-account"
                  style={{ border: "none", padding: 0 }}
                  inputMode="numeric"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="예: 123456-01-234567"
                />
                <SmallBtn type="button" onClick={() => setAccountRevealed(false)}>
                  가리기
                </SmallBtn>
              </MaskedBox>
            ) : (
              <MaskedBox>
                <span style={{ flex: 1 }}>
                  {bankAccountNo ? maskAccountNo(bankAccountNo) : "등록된 계좌 없음"}
                </span>
                <SmallBtn type="button" onClick={() => setAccountRevealed(true)}>
                  보기
                </SmallBtn>
              </MaskedBox>
            )}
            <FieldHint>수정하려면 [보기]를 눌러 전체 번호를 표시하세요.</FieldHint>
          </div>
        </FieldGrid>
        <SaveRow>
          <SaveBtn type="button" disabled={bankSaving} onClick={saveBank}>
            {bankSaving ? "저장 중…" : "계좌 저장"}
          </SaveBtn>
          {bankMsg ? <Msg $error={bankMsg.error}>{bankMsg.text}</Msg> : null}
        </SaveRow>
      </Card>

      <Card>
        <SectionTitle>비밀번호 변경</SectionTitle>
        <SectionSub>변경 즉시 적용됩니다. (다시 로그인할 필요 없음)</SectionSub>
        <FieldGrid>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldLabel htmlFor="p-cur">현재 비밀번호</FieldLabel>
            <TextInput
              id="p-cur"
              type="password"
              autoComplete="current-password"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="p-new">새 비밀번호 (8자 이상)</FieldLabel>
            <TextInput
              id="p-new"
              type="password"
              autoComplete="new-password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="p-new2">새 비밀번호 확인</FieldLabel>
            <TextInput
              id="p-new2"
              type="password"
              autoComplete="new-password"
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
            />
          </div>
        </FieldGrid>
        <SaveRow>
          <SaveBtn
            type="button"
            disabled={pwSaving || !curPw || !newPw || !newPw2}
            onClick={changePassword}
          >
            {pwSaving ? "변경 중…" : "비밀번호 변경"}
          </SaveBtn>
          {pwMsg ? <Msg $error={pwMsg.error}>{pwMsg.text}</Msg> : null}
        </SaveRow>
      </Card>

      {/* Step 28: 근무 슬롯·방문 일정은 OTC 예약 업무 — manageOtc 없는 운영자에게 숨김 */}
      {profile.manageOtc ? (
      <Card>
        <SectionTitle>내 근무 · 오늘 일정</SectionTitle>
        <SectionSub>오늘 내게 배정된 확정 방문과 이번 주 근무 슬롯 요약.</SectionSub>
        {today == null ? (
          <EmptyLine>불러오는 중…</EmptyLine>
        ) : today.length === 0 ? (
          <EmptyLine>오늘 확정된 방문 일정이 없습니다.</EmptyLine>
        ) : (
          <ScheduleList>
            {today.map((t) => (
              <ScheduleItem key={t.orderId}>
                <strong>{t.time}</strong>
                <Link
                  href={`/admin/miracle10/${t.orderId}`}
                  style={{ color: "inherit", textDecoration: "none", fontWeight: 700 }}
                >
                  {t.name}
                </Link>
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: adminColors.textMuted }}>
                  {t.officeName ?? ""}
                </span>
              </ScheduleItem>
            ))}
          </ScheduleList>
        )}
        {slotSummary == null ? null : slotSummary.length === 0 ? (
          <EmptyLine>이번 주 등록된 근무 슬롯이 없습니다.</EmptyLine>
        ) : (
          slotSummary.map((line) => (
            <SlotSummaryLine key={line}>{line}</SlotSummaryLine>
          ))
        )}
        <FootLink href="/admin/schedule">근무 슬롯 등록·해제는 일정 캘린더에서 →</FootLink>
      </Card>
      ) : null}
    </Page>
  );
}
