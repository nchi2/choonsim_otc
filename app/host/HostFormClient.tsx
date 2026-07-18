"use client";

// 행사 개설 신청 폼 — POST /api/education/host 로 제출(status=PENDING 생성, 승인은 어드민).
// 로그인 + 교육자 승인 필수(게이트는 서버 페이지). 개설자 정보는 회원 정보 자동.
// 섹션: 기본정보 / 일시·장소 / 모집·비용 / 안내사항 / 포스터. 필수/선택 명확 + 예시 안내.
// ★ 포스터는 미리보기 UI만 — 실제 업로드(R2)는 다음 Step. 제출 시 무시.
// Turnstile: 키 장착 시 제출 body의 turnstileToken 자리에 위젯 token을 실으면 서버 검증이 켜진다.

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { PublicShell } from "@/components/education/PublicShell";
import {
  POSTER_ASPECT_CSS,
  POSTER_ASPECT_H,
  POSTER_ASPECT_W,
} from "@/components/education/PosterCard";
import {
  CATEGORY_LABEL,
  MODE_LABEL,
  eduColors,
  eduLayout,
  media,
} from "@/components/education/tokens";

const PageTitle = styled.h1`
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 800;
  color: ${eduColors.text};
`;
const PageSub = styled.p`
  margin: 0 0 1.5rem;
  font-size: 0.85rem;
  color: ${eduColors.textMuted};
  line-height: 1.6;
`;

const Form = styled.form`
  max-width: 720px;
`;

const Fieldset = styled.fieldset`
  border: 1px solid ${eduColors.border};
  border-radius: ${eduLayout.radius}px;
  padding: 1.1rem 1.25rem 1.3rem;
  margin: 0 0 1.25rem;

  legend {
    padding: 0 0.5rem;
    font-size: 0.9rem;
    font-weight: 800;
    color: ${eduColors.primary};
  }
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.85rem;
  ${media.sm} {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: block;
  margin-bottom: 0.95rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FieldLabel = styled.span`
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${eduColors.textSub};
  margin-bottom: 0.3rem;

  em {
    color: ${eduColors.danger};
    font-style: normal;
  }
`;

const FieldHint = styled.span`
  display: block;
  font-size: 0.72rem;
  color: ${eduColors.textFaint};
  margin-bottom: 0.35rem;
  line-height: 1.45;
`;

const baseInput = `
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid ${eduColors.borderInput};
  border-radius: 8px;
  font-size: 0.88rem;
  background: ${eduColors.surface};
  color: ${eduColors.text};
  &:focus { outline: none; border-color: ${eduColors.primary}; }
  &:disabled { background: ${eduColors.bg}; color: ${eduColors.textFaint}; }
  &:read-only { background: ${eduColors.bg}; color: ${eduColors.textMuted}; }
`;
const Input = styled.input`
  ${baseInput}
`;
const Textarea = styled.textarea`
  ${baseInput}
  min-height: 84px;
  resize: vertical;
`;
const Select = styled.select`
  ${baseInput}
`;

const SessionRow = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr auto;
  gap: 0.5rem;
  align-items: end;
  margin-bottom: 0.55rem;

  ${media.sm} {
    grid-template-columns: 1fr 1fr;
  }
`;

const MiniLabel = styled.span`
  display: block;
  font-size: 0.66rem;
  font-weight: 700;
  color: ${eduColors.textFaint};
  margin-bottom: 0.2rem;
`;

const SmallBtn = styled.button`
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  border: 1px solid ${eduColors.borderInput};
  background: ${eduColors.surface};
  color: ${eduColors.textSub};
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    border-color: ${eduColors.primary};
    color: ${eduColors.primary};
  }
`;

const AddBtn = styled(SmallBtn)`
  margin-top: 0.25rem;
`;

const SubmitBtn = styled.button`
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 10px;
  background: ${eduColors.primary};
  color: ${eduColors.white};
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${eduColors.primaryHover};
  }
  &:disabled {
    background: ${eduColors.textFaint};
    cursor: not-allowed;
  }
`;

const AgreeRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: ${eduColors.textMuted};
  line-height: 1.5;
  margin: 0.5rem 0 1rem;
  cursor: pointer;
  input {
    margin-top: 0.15rem;
    width: 1.1rem;
    height: 1.1rem;
    accent-color: ${eduColors.primary};
  }
`;

const ErrorNote = styled.div`
  margin-bottom: 0.8rem;
  padding: 0.7rem 0.85rem;
  border-radius: 9px;
  background: ${eduColors.dangerSoft};
  border: 1px solid ${eduColors.danger}33;
  color: ${eduColors.danger};
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
`;

const DoneCard = styled.div`
  max-width: 720px;
  padding: 2rem 1.5rem;
  text-align: center;
  border: 1px solid ${eduColors.primaryBorder};
  border-radius: ${eduLayout.radius}px;
  background: ${eduColors.primarySofter};

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.15rem;
    color: ${eduColors.text};
  }
  p {
    margin: 0;
    font-size: 0.88rem;
    color: ${eduColors.textMuted};
    line-height: 1.6;
  }
`;

/* 포스터 첨부 — 미리보기 UI만(R2 연동 예정) */
const PosterDrop = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
`;
const PosterPreview = styled.div`
  width: 160px;
  aspect-ratio: ${POSTER_ASPECT_CSS};
  border-radius: 10px;
  border: 1px dashed ${eduColors.borderInput};
  background: ${eduColors.bg};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${eduColors.textFaint};
  font-size: 0.72rem;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
const PosterCtl = styled.div`
  flex: 1;
  min-width: 200px;
  font-size: 0.75rem;
  color: ${eduColors.textMuted};
  line-height: 1.55;

  input[type="file"] {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.78rem;
  }
`;
const PosterWarn = styled.p`
  margin: 0.3rem 0 0;
  color: ${eduColors.warn};
  font-weight: 600;
`;

interface SessionInput {
  date: string;
  startTime: string;
  endTime: string;
}

const MAX_POSTER_BYTES = 5 * 1024 * 1024;
const POSTER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function HostFormClient({
  offices,
  host,
}: {
  offices: { id: number; name: string }[];
  /** 로그인한 승인 교육자 — 개설자 정보는 회원 정보로 자동(서버도 회원 정보로 스냅샷) */
  host: { name: string; email: string; phone: string | null };
}) {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 기본 정보
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("LECTURE");
  const [descriptionMd, setDescriptionMd] = useState("");
  const [instructorName, setInstructorName] = useState(host.name);
  const [instructorBio, setInstructorBio] = useState("");

  // 일시·장소·방식
  const [sessions, setSessions] = useState<SessionInput[]>([
    { date: "", startTime: "", endTime: "" },
  ]);
  const [officeId, setOfficeId] = useState<string>(""); // "" = 직접 입력
  const [customLocation, setCustomLocation] = useState("");
  const [mode, setMode] = useState("OFFLINE");
  const [streamUrl, setStreamUrl] = useState("");
  const [capacity, setCapacity] = useState("");
  const [feeKrw, setFeeKrw] = useState("");

  // 입금·안내
  const [depositBankName, setDepositBankName] = useState("");
  const [depositAccountNo, setDepositAccountNo] = useState("");
  const [depositAccountHolder, setDepositAccountHolder] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [preparation, setPreparation] = useState("");
  const [reward, setReward] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");
  const [notice, setNotice] = useState("");
  const [applyDeadline, setApplyDeadline] = useState("");

  // 포스터(미리보기 전용) + 동의
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterWarn, setPosterWarn] = useState<string | null>(null);
  const posterUrlRef = useRef<string | null>(null);
  const [agree, setAgree] = useState(false);

  const paid = Number(feeKrw) > 0;
  const isOnlineMode = mode === "ONLINE" || mode === "HYBRID";

  useEffect(() => {
    return () => {
      if (posterUrlRef.current) URL.revokeObjectURL(posterUrlRef.current);
    };
  }, []);

  const onPosterChange = (file: File | null) => {
    if (posterUrlRef.current) {
      URL.revokeObjectURL(posterUrlRef.current);
      posterUrlRef.current = null;
    }
    setPosterWarn(null);
    if (!file) {
      setPosterPreview(null);
      return;
    }
    if (!POSTER_TYPES.includes(file.type)) {
      setPosterWarn("jpg·png·webp 이미지만 첨부할 수 있어요.");
      setPosterPreview(null);
      return;
    }
    if (file.size > MAX_POSTER_BYTES) {
      setPosterWarn("파일이 5MB를 초과합니다. 더 작은 이미지를 사용해 주세요.");
      setPosterPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    posterUrlRef.current = url;
    setPosterPreview(url);
  };

  const updateSession = (i: number, patch: Partial<SessionInput>) =>
    setSessions((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addSession = () =>
    setSessions((prev) => [...prev, { date: "", startTime: "", endTime: "" }]);
  const removeSession = (i: number) =>
    setSessions((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const canSubmit =
    !submitting &&
    title.trim() !== "" &&
    (officeId !== "" || customLocation.trim() !== "") &&
    sessions.some((s) => s.date && s.startTime) &&
    agree;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/education/host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          descriptionMd: descriptionMd.trim() || null,
          instructorName: instructorName.trim() || null,
          instructorBio: instructorBio.trim() || null,
          sessions: sessions.filter((s) => s.date && s.startTime),
          officeId: officeId ? Number(officeId) : null,
          customLocation: officeId ? null : customLocation.trim() || null,
          mode,
          streamUrl: isOnlineMode ? streamUrl.trim() || null : null,
          capacity: capacity ? Number(capacity) : null,
          feeKrw: Number(feeKrw) || 0,
          depositBankName: depositBankName.trim() || null,
          depositAccountNo: depositAccountNo.trim() || null,
          depositAccountHolder: depositAccountHolder.trim() || null,
          eligibility: eligibility.trim() || null,
          preparation: preparation.trim() || null,
          reward: reward.trim() || null,
          refundPolicy: refundPolicy.trim() || null,
          notice: notice.trim() || null,
          applyDeadline: applyDeadline || null,
          // 포스터는 R2 연동 예정 — 지금은 미리보기만이라 제출에 포함하지 않음.
          // 개설자 정보(hostName/Contact/Email)는 서버가 로그인 회원 정보로 채움.
          // [TURNSTILE 위젯 자리] 사이트키 장착 시 위젯 token을 싣는다.
          turnstileToken: null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "개설 신청 접수에 실패했습니다.");
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "개설 신청 접수에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <PublicShell showTicker={false}>
        <DoneCard>
          <h2>개설 신청이 접수되었습니다</h2>
          <p>
            운영팀이 내용을 검토한 뒤 안내드립니다. 승인되면 행사가 공개되며,
            마이페이지 &quot;내가 연 강의&quot;에서 상태를 확인할 수 있습니다.
          </p>
        </DoneCard>
      </PublicShell>
    );
  }

  return (
    <PublicShell showTicker={false}>
      <PageTitle>행사 개설 신청</PageTitle>
      <PageSub>
        모빅회관에서 강의·워크숍·이벤트를 열어보세요. 아래 내용을 작성해
        신청하시면 운영팀 검토 후 공개됩니다. <em>*</em> 표시는 필수 항목입니다.
      </PageSub>

      <Form onSubmit={handleSubmit}>
        {/* ── 기본 정보 ── */}
        <Fieldset>
          <legend>기본 정보</legend>
          <Field>
            <FieldLabel>
              행사 제목 <em>*</em>
            </FieldLabel>
            <FieldHint>예: 서초모빅회관 춘심 SBMB 강연</FieldHint>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="행사 이름을 입력하세요"
              required
            />
          </Field>
          <Grid2>
            <Field>
              <FieldLabel>분류</FieldLabel>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <FieldLabel>진행 방식</FieldLabel>
              <Select value={mode} onChange={(e) => setMode(e.target.value)}>
                {Object.entries(MODE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          </Grid2>
          {isOnlineMode ? (
            <Field>
              <FieldLabel>스트림 링크</FieldLabel>
              <FieldHint>온라인·혼합 진행 시 참여자에게 안내할 링크(Zoom·YouTube 등)</FieldHint>
              <Input
                type="url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://"
              />
            </Field>
          ) : null}
          <Field>
            <FieldLabel>행사 소개</FieldLabel>
            <FieldHint>
              어떤 내용을 다루는지 자유롭게 적어주세요. 마크다운(## 제목, - 목록,
              **굵게**)을 지원합니다.
            </FieldHint>
            <Textarea
              value={descriptionMd}
              onChange={(e) => setDescriptionMd(e.target.value)}
              placeholder={
                "## 강연 내용\n- SBMB Q&A\n- Trust Wallet 기초 (지갑 생성·토큰 전송)\n- 토큰 스테이킹 / Uniswap 스왑"
              }
            />
          </Field>
          <Grid2>
            <Field>
              <FieldLabel>강사명</FieldLabel>
              <FieldHint>예: 춘심팀 / 가브리엘(수모크루)</FieldHint>
              <Input
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                placeholder="강사 또는 진행자"
              />
            </Field>
            <Field>
              <FieldLabel>강사 소개</FieldLabel>
              <FieldHint>한 줄 소개 (선택)</FieldHint>
              <Input
                value={instructorBio}
                onChange={(e) => setInstructorBio(e.target.value)}
                placeholder="예: 10년차 EVM 지갑 강사"
              />
            </Field>
          </Grid2>
        </Fieldset>

        {/* ── 일시 · 장소 ── */}
        <Fieldset>
          <legend>일시 · 장소</legend>
          <FieldLabel>
            회차 <em>*</em>
          </FieldLabel>
          <FieldHint>여러 날에 걸쳐 열린다면 회차를 추가하세요. 종료 시간은 선택입니다.</FieldHint>
          {sessions.map((s, i) => (
            <SessionRow key={i}>
              <label>
                <MiniLabel>날짜{i === 0 ? " *" : ""}</MiniLabel>
                <Input
                  type="date"
                  value={s.date}
                  onChange={(e) => updateSession(i, { date: e.target.value })}
                  aria-label={`${i + 1}회차 날짜`}
                />
              </label>
              <label>
                <MiniLabel>시작{i === 0 ? " *" : ""}</MiniLabel>
                <Input
                  type="time"
                  value={s.startTime}
                  onChange={(e) => updateSession(i, { startTime: e.target.value })}
                  aria-label={`${i + 1}회차 시작`}
                />
              </label>
              <label>
                <MiniLabel>종료</MiniLabel>
                <Input
                  type="time"
                  value={s.endTime}
                  onChange={(e) => updateSession(i, { endTime: e.target.value })}
                  aria-label={`${i + 1}회차 종료`}
                />
              </label>
              {sessions.length > 1 ? (
                <SmallBtn type="button" onClick={() => removeSession(i)}>
                  삭제
                </SmallBtn>
              ) : (
                <span />
              )}
            </SessionRow>
          ))}
          <AddBtn type="button" onClick={addSession}>
            + 회차 추가
          </AddBtn>

          <Grid2 style={{ marginTop: "1.1rem" }}>
            <Field>
              <FieldLabel>
                회관 선택 <em>*</em>
              </FieldLabel>
              <FieldHint>회관이 없으면 &quot;직접 입력&quot;을 골라 장소를 적으세요.</FieldHint>
              <Select value={officeId} onChange={(e) => setOfficeId(e.target.value)}>
                <option value="">직접 입력</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <FieldLabel>직접 입력 장소</FieldLabel>
              <FieldHint>회관 미선택 시</FieldHint>
              <Input
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="예: 수원모빅회관"
                disabled={officeId !== ""}
              />
            </Field>
          </Grid2>
        </Fieldset>

        {/* ── 모집 · 비용 ── */}
        <Fieldset>
          <legend>모집 · 비용</legend>
          <Grid2>
            <Field>
              <FieldLabel>정원</FieldLabel>
              <FieldHint>비우면 인원 제한 없음</FieldHint>
              <Input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="예: 40"
              />
            </Field>
            <Field>
              <FieldLabel>참가비 (원)</FieldLabel>
              <FieldHint>0이면 무료 행사</FieldHint>
              <Input
                type="number"
                min="0"
                value={feeKrw}
                onChange={(e) => setFeeKrw(e.target.value)}
                placeholder="예: 10000"
              />
            </Field>
          </Grid2>
          <Field>
            <FieldLabel>신청 마감일</FieldLabel>
            <FieldHint>비우면 행사 시작 전까지 신청 가능</FieldHint>
            <Input
              type="date"
              value={applyDeadline}
              onChange={(e) => setApplyDeadline(e.target.value)}
            />
          </Field>
          {paid ? (
            <>
              <FieldLabel style={{ marginTop: "0.3rem" }}>입금 계좌 안내</FieldLabel>
              <FieldHint>유료 행사는 신청자에게 아래 계좌를 안내합니다.</FieldHint>
              <Grid2>
                <Field>
                  <FieldLabel>입금 은행</FieldLabel>
                  <Input
                    value={depositBankName}
                    onChange={(e) => setDepositBankName(e.target.value)}
                    placeholder="예: 국민은행"
                  />
                </Field>
                <Field>
                  <FieldLabel>계좌번호</FieldLabel>
                  <Input
                    value={depositAccountNo}
                    onChange={(e) => setDepositAccountNo(e.target.value)}
                    placeholder="예: 366501-01-204058"
                  />
                </Field>
              </Grid2>
              <Field>
                <FieldLabel>예금주</FieldLabel>
                <Input
                  value={depositAccountHolder}
                  onChange={(e) => setDepositAccountHolder(e.target.value)}
                  placeholder="예: 홍길동"
                />
              </Field>
            </>
          ) : null}
        </Fieldset>

        {/* ── 안내사항 ── */}
        <Fieldset>
          <legend>안내사항 (선택)</legend>
          <Field>
            <FieldLabel>참여 대상·조건</FieldLabel>
            <Input
              value={eligibility}
              onChange={(e) => setEligibility(e.target.value)}
              placeholder="예: SBMB에 관심 있는 누구나"
            />
          </Field>
          <Field>
            <FieldLabel>준비물</FieldLabel>
            <Input
              value={preparation}
              onChange={(e) => setPreparation(e.target.value)}
              placeholder="예: 10모의 기적 종이지갑 지참"
            />
          </Field>
          <Field>
            <FieldLabel>리워드</FieldLabel>
            <Input
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="예: 이더리움 지갑 1장"
            />
          </Field>
          <Field>
            <FieldLabel>환불·노쇼 규정</FieldLabel>
            <Input
              value={refundPolicy}
              onChange={(e) => setRefundPolicy(e.target.value)}
              placeholder="예: 신청 후 취소 불가, 불참 시 환불·리워드 없음"
            />
          </Field>
          <Field>
            <FieldLabel>기타 유의사항</FieldLabel>
            <Textarea
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="예: 주차 불가, 대중교통 권장"
            />
          </Field>
        </Fieldset>

        {/* ── 포스터 (미리보기 UI만) ── */}
        <Fieldset>
          <legend>포스터 (선택)</legend>
          <PosterDrop>
            <PosterPreview>
              {posterPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={posterPreview} alt="포스터 미리보기" />
              ) : (
                `${POSTER_ASPECT_W}:${POSTER_ASPECT_H} 미리보기`
              )}
            </PosterPreview>
            <PosterCtl>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => onPosterChange(e.target.files?.[0] ?? null)}
              />
              권장 규격: {POSTER_ASPECT_W}:{POSTER_ASPECT_H} 비율(예: 1200×900), 5MB 이하,
              jpg·png·webp. 없으면 카테고리별 기본 디자인이 사용됩니다.
              {posterPreview ? (
                <div style={{ marginTop: "0.4rem" }}>
                  <SmallBtn type="button" onClick={() => onPosterChange(null)}>
                    포스터 제거
                  </SmallBtn>
                </div>
              ) : null}
              {posterWarn ? <PosterWarn>{posterWarn}</PosterWarn> : null}
              {/* R2 연동 예정 — 현재는 미리보기만, 제출 시 업로드하지 않음 */}
            </PosterCtl>
          </PosterDrop>
        </Fieldset>

        {/* ── 개설자 정보 (자동) ── */}
        <Fieldset>
          <legend>개설자 정보 (회원 정보 자동 사용)</legend>
          <Grid2>
            <Field>
              <FieldLabel>이름</FieldLabel>
              <Input value={host.name} readOnly />
            </Field>
            <Field>
              <FieldLabel>연락처</FieldLabel>
              <Input value={host.phone ?? "미등록 — 마이페이지에서 등록"} readOnly />
            </Field>
          </Grid2>
          <Field>
            <FieldLabel>이메일</FieldLabel>
            <Input value={host.email} readOnly />
          </Field>
        </Fieldset>

        <AgreeRow>
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            입력한 정보로 운영팀이 검토·연락하는 데 동의합니다. 신청 정보는 검토
            목적으로만 사용됩니다.
          </span>
        </AgreeRow>

        {error ? <ErrorNote role="alert">{error}</ErrorNote> : null}

        <SubmitBtn type="submit" disabled={!canSubmit}>
          {submitting ? "접수 중…" : "개설 신청하기"}
        </SubmitBtn>
      </Form>
    </PublicShell>
  );
}
