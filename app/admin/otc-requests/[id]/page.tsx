"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import {
  OTC_REQUEST_STATUSES,
  otcRequestStatusColor,
  otcRequestStatusLabel,
  otcSideLabel,
  type OtcRequestStatus,
} from "@/lib/otc-request-status";
import { formatKstYmdLong } from "@/lib/kst";
import { StateBox, adminColors } from "@/components/admin/ui";
import { CommentsSection } from "@/components/admin/CommentsSection";
import { useAdminPageHeader } from "@/components/admin/AdminPageHeaderContext";

const Page = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 0.5rem 1rem 1rem;

  @media (min-width: 768px) {
    padding: 0.5rem 1.5rem 1rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
  text-decoration: none;
  &:hover {
    color: #111827;
  }
`;

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.25rem;
`;

const SectionTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 700;
  color: #374151;
  margin: 0 0 0.75rem;
`;

const SectionSub = styled.p`
  font-size: 0.78rem;
  color: #6b7280;
  margin: 0 0 0.75rem;
  line-height: 1.45;
`;

const Field = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 0.5rem;
  padding: 0.4rem 0;
  border-top: 1px solid #f5f5f5;
  font-size: 0.9rem;
  &:first-of-type {
    border-top: none;
  }

  /* 초소형 화면 — 라벨 위, 값 아래 */
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
`;

const Key = styled.span`
  color: #6b7280;
`;

const Val = styled.span`
  color: #111827;
  font-weight: 500;
  word-break: break-all;
`;

const Badge = styled.span<{ $color: string }>`
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: ${(p) => p.$color};
`;

/** 메인 배너와 동일 브랜드 색 — 구매 #A8639F / 판매 #6570C5. */
const SideBadge = styled.span<{ $side: string }>`
  display: inline-block;
  padding: 3px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  background: ${(p) => (p.$side === "SELL" ? "#6570c5" : "#a8639f")};
`;

const ActionCard = styled(Card)`
  border-color: #c7d2fe;
  background: #fafaff;
`;

const NextActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
`;

const PrimaryActionBtn = styled.button`
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  border: none;
  background: ${adminColors.primary};
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const TelLinkBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.1rem;
  border: 1.5px solid ${adminColors.primary};
  border-radius: 10px;
  background: #fff;
  color: ${adminColors.primary};
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
`;

const ActionHint = styled.p`
  margin: 0.6rem 0 0;
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.5;
`;

const ManualStatusDivider = styled.div`
  margin: 1rem 0 0.6rem;
  border-top: 1px dashed #e5e7eb;
  padding-top: 0.6rem;
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 600;
`;

const StatusButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StatusButton = styled.button<{ $active: boolean; $color: string }>`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1.5px solid ${(p) => p.$color};
  background: ${(p) => (p.$active ? p.$color : "#fff")};
  color: ${(p) => (p.$active ? "#fff" : p.$color)};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EditGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 0.3rem;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.55rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
`;

const MemoArea = styled.textarea`
  width: 100%;
  min-height: 90px;
  padding: 0.55rem 0.7rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
  resize: vertical;
  font-family: inherit;
`;

const SaveRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
`;

const SaveMsg = styled.span<{ $error?: boolean }>`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${(p) => (p.$error ? "#dc2626" : "#059669")};
`;

interface Detail {
  id: number;
  createdAt: string;
  side: string;
  name: string;
  contact: string;
  quantity: number;
  desiredPrice: number | null;
  receiveAddress: string | null;
  visitDate: string | null;
  reservedStart: string | null;
  officeId: number | null;
  office: { id: number; name: string } | null;
  senderAddress: string | null;
  bankInfo: string | null;
  sellerBankName: string | null;
  sellerAccountNo: string | null;
  sellerAccountHolder: string | null;
  customerBankInfo: string | null;
  buyerBankName: string | null;
  buyerAccountNo: string | null;
  buyerAccountHolder: string | null;
  memo: string | null;
  status: string;
  adminMemo: string | null;
  lastEditedBy: string | null;
  lastEditedByName: string | null;
  lastEditedAt: string | null;
}

function formatBank(
  bankName: string | null,
  accountNo: string | null,
  holder: string | null,
  legacy: string | null,
): string {
  const parts = [bankName, accountNo, holder].filter(
    (v): v is string => !!v && v.trim() !== "",
  );
  if (parts.length > 0) return parts.join(" · ");
  return legacy?.trim() || "-";
}

export default function OtcRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/otc-requests/${id}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "불러오지 못했습니다.");
      }
      setData(json.request);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  // 셸이 유일한 제목 소유자 — 배지 포함 제목을 헤더로 전달 (본문 h1 없음)
  const headerTitle = useMemo(
    () =>
      data ? (
        <>
          OTC 신청 #{data.id}
          <SideBadge $side={data.side}>{otcSideLabel(data.side)}</SideBadge>
          <Badge $color={otcRequestStatusColor(data.status)}>
            {otcRequestStatusLabel(data.status)}
          </Badge>
        </>
      ) : undefined,
    [data],
  );
  useAdminPageHeader(headerTitle);

  const changeStatus = async (status: OtcRequestStatus) => {
    if (!data || data.status === status || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/otc-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "상태 변경 실패");
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <Page>
        <StateBox $variant="loading">불러오는 중…</StateBox>
      </Page>
    );
  if (error)
    return (
      <Page>
        <StateBox $variant="error">{error}</StateBox>
      </Page>
    );
  if (!data) return null;

  const isSell = data.side === "SELL";

  return (
    <Page>
      <BackLink href="/admin/requests?type=otc">← 목록으로</BackLink>

      <ActionCard>
        <SectionTitle>다음 액션</SectionTitle>

        {data.status === "PENDING" ? (
          <>
            <NextActionRow>
              <TelLinkBtn
                href={`tel:${data.contact.replace(/[^+\d]/g, "")}`}
              >
                📞 {data.contact}
              </TelLinkBtn>
              <PrimaryActionBtn
                disabled={saving}
                onClick={() => changeStatus("CONTACTED")}
              >
                연락 완료 처리
              </PrimaryActionBtn>
            </NextActionRow>
            <ActionHint>
              손님에게 연락해 거래 조건(수량·가격·방식)을 확인한 뒤 「연락 완료
              처리」를 눌러주세요.
            </ActionHint>
          </>
        ) : null}

        {data.status === "CONTACTED" ? (
          <>
            <NextActionRow>
              <PrimaryActionBtn
                disabled={saving}
                onClick={() => changeStatus("AGREED")}
              >
                합의 완료 처리
              </PrimaryActionBtn>
            </NextActionRow>
            <ActionHint>
              가격·수량·{isSell ? "입금 계좌" : "전달 방식"} 합의가 끝나면
              「합의 완료」로 넘겨주세요.
              {isSell
                ? " 판매 건은 아래 「운영자 작업」에서 매수자 계좌를 등록해 손님에게 안내합니다."
                : ""}
            </ActionHint>
          </>
        ) : null}

        {data.status === "AGREED" ? (
          <>
            <NextActionRow>
              <PrimaryActionBtn
                disabled={saving}
                onClick={() => {
                  if (window.confirm("거래 완료 처리하시겠습니까?")) {
                    changeStatus("COMPLETED");
                  }
                }}
              >
                거래 완료 처리
              </PrimaryActionBtn>
            </NextActionRow>
            <ActionHint>
              {isSell
                ? "코인 수령·원화 입금까지 끝났으면 완료 처리하세요."
                : "원화 수령·코인 전달까지 끝났으면 완료 처리하세요."}
            </ActionHint>
          </>
        ) : null}

        {data.status === "COMPLETED" || data.status === "CANCELED" ? (
          <ActionHint style={{ marginTop: 0 }}>
            {data.status === "COMPLETED"
              ? "완료된 신청입니다. 필요 시 아래에서 상태를 직접 변경할 수 있습니다."
              : "취소된 신청입니다. 필요 시 아래에서 상태를 직접 변경할 수 있습니다."}
          </ActionHint>
        ) : null}

        <ManualStatusDivider>상태 직접 변경</ManualStatusDivider>
        <StatusButtons>
          {OTC_REQUEST_STATUSES.map((s) => (
            <StatusButton
              key={s}
              $active={data.status === s}
              $color={otcRequestStatusColor(s)}
              disabled={saving || data.status === s}
              onClick={() => changeStatus(s)}
            >
              {otcRequestStatusLabel(s)}
            </StatusButton>
          ))}
        </StatusButtons>
      </ActionCard>

      <Card>
        <SectionTitle>신청인</SectionTitle>
        <Field>
          <Key>이름</Key>
          <Val>{data.name}</Val>
        </Field>
        <Field>
          <Key>연락처</Key>
          <Val>{data.contact}</Val>
        </Field>
        <Field>
          <Key>접수일시</Key>
          <Val>{new Date(data.createdAt).toLocaleString("ko-KR")}</Val>
        </Field>
      </Card>

      <Card>
        <SectionTitle>신청 내용 — {otcSideLabel(data.side)}</SectionTitle>
        <Field>
          <Key>수량</Key>
          <Val>{data.quantity.toLocaleString("ko-KR")}</Val>
        </Field>
        <Field>
          <Key>희망가</Key>
          <Val>
            {data.desiredPrice != null
              ? `${data.desiredPrice.toLocaleString("ko-KR")}원`
              : "미정 (합의)"}
          </Val>
        </Field>
        {isSell ? (
          <>
            <Field>
              <Key>보낼 지갑주소</Key>
              <Val>{data.senderAddress || "-"}</Val>
            </Field>
            <Field>
              <Key>판매자 계좌</Key>
              <Val>
                {formatBank(
                  data.sellerBankName,
                  data.sellerAccountNo,
                  data.sellerAccountHolder,
                  data.bankInfo,
                )}
              </Val>
            </Field>
          </>
        ) : (
          <>
            <Field>
              <Key>받을 지갑주소</Key>
              <Val>{data.receiveAddress || "-"}</Val>
            </Field>
            <Field>
              <Key>방문 희망</Key>
              <Val>
                {data.visitDate
                  ? `${formatKstYmdLong(data.visitDate) ?? data.visitDate}${
                      data.reservedStart ? ` ${data.reservedStart}` : ""
                    }${data.office ? ` · ${data.office.name}` : ""}`
                  : "-"}
              </Val>
            </Field>
          </>
        )}
        <Field>
          <Key>손님 메모</Key>
          <Val>{data.memo || "-"}</Val>
        </Field>
      </Card>

      <OperatorSection request={data} onSaved={load} />

      <Card>
        <SectionTitle>기록</SectionTitle>
        <Field>
          <Key>최종 수정</Key>
          <Val>
            {data.lastEditedByName && data.lastEditedAt
              ? `${data.lastEditedByName} · ${new Date(data.lastEditedAt).toLocaleString("ko-KR")}`
              : "-"}
          </Val>
        </Field>
      </Card>

      <CommentsSection targetType="OTC_REQUEST" targetId={data.id} />
    </Page>
  );
}

/* ── 운영자 작업 — 매수자 계좌 등록 + 운영자 메모 ── */

function OperatorSection({
  request,
  onSaved,
}: {
  request: Detail;
  onSaved: () => void;
}) {
  const [bankName, setBankName] = useState(request.buyerBankName ?? "");
  const [accountNo, setAccountNo] = useState(request.buyerAccountNo ?? "");
  const [holder, setHolder] = useState(request.buyerAccountHolder ?? "");
  const [adminMemo, setAdminMemo] = useState(request.adminMemo ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  const hasChanges =
    bankName.trim() !== (request.buyerBankName ?? "") ||
    accountNo.trim() !== (request.buyerAccountNo ?? "") ||
    holder.trim() !== (request.buyerAccountHolder ?? "") ||
    adminMemo.trim() !== (request.adminMemo ?? "");

  const save = async () => {
    if (saving || !hasChanges) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/otc-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerBankName: bankName.trim() || null,
          buyerAccountNo: accountNo.trim() || null,
          buyerAccountHolder: holder.trim() || null,
          adminMemo: adminMemo.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "저장 실패");
      }
      setSaveMsg({ text: "저장되었습니다." });
      onSaved();
    } catch (e) {
      setSaveMsg({
        text: e instanceof Error ? e.message : "저장에 실패했습니다.",
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <SectionTitle>운영자 작업</SectionTitle>
      <SectionSub>
        매수자 계좌 — {request.side === "SELL" ? "판매 건" : "이 거래"}에서
        원화를 입금할 쪽의 계좌를 등록해 손님 안내에 사용합니다.
      </SectionSub>
      {request.customerBankInfo ? (
        <SectionSub>레거시 기록: {request.customerBankInfo}</SectionSub>
      ) : null}
      <EditGrid>
        <div>
          <FieldLabel htmlFor="buyer-bank">은행명</FieldLabel>
          <TextInput
            id="buyer-bank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="예: 국민은행"
          />
        </div>
        <div>
          <FieldLabel htmlFor="buyer-account">계좌번호</FieldLabel>
          <TextInput
            id="buyer-account"
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <div>
          <FieldLabel htmlFor="buyer-holder">예금주</FieldLabel>
          <TextInput
            id="buyer-holder"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          />
        </div>
      </EditGrid>

      <div style={{ marginTop: "0.8rem" }}>
        <FieldLabel htmlFor="admin-memo">운영자 메모</FieldLabel>
        <MemoArea
          id="admin-memo"
          value={adminMemo}
          onChange={(e) => setAdminMemo(e.target.value)}
          placeholder="협의 내용·특이사항 등 내부 기록"
        />
      </div>

      <SaveRow>
        <PrimaryActionBtn
          type="button"
          disabled={saving || !hasChanges}
          onClick={save}
        >
          {saving ? "저장 중…" : "저장"}
        </PrimaryActionBtn>
        {saveMsg ? (
          <SaveMsg $error={saveMsg.error}>{saveMsg.text}</SaveMsg>
        ) : null}
      </SaveRow>
    </Card>
  );
}
