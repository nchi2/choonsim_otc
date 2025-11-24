"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import PageLayout from "@/components/layouts/PageLayout";
import * as FormStyles from "@/components/forms/styles";
import { BRANCH_NAMES } from "@/lib/branch-info";
import { useRouter } from "next/navigation";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem 1rem;
  background-color: #ffffff;
  margin: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    padding: 4rem 2rem;
    margin: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
  }
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    margin-bottom: 3rem;
  }
`;

const PriceSection = styled.div`
  padding: 1rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1.25rem;
  }
`;

const ModeIndicator = styled.div`
  padding: 0.75rem 1rem;
  background-color: #dbeafe;
  border: 1px solid #3b82f6;
  border-radius: 0.375rem;
  color: #1e40af;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem 1.25rem;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;

  @media (min-width: 768px) {
    gap: 2rem;
  }
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const RadioInput = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
`;

const PriceInfo = styled.div`
  padding: 1rem;
  background-color: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 0.375rem;
  color: #1e40af;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1.25rem;
  }
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.375rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1rem;
  }
`;

const PriceInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const PriceInputLabel = styled.label`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: border-color 0.2s;

  &:hover {
    border-color: #9ca3af;
  }

  @media (min-width: 768px) {
    padding: 1.25rem;
  }
`;

const CheckboxInput = styled.input`
  margin-top: 0.25rem;
  cursor: pointer;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  line-height: 1.5;
  flex: 1;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

// Form, FormGroup, Label, Input, Select, ErrorMessage, PrimaryButton은 FormStyles에서 import
const Form = FormStyles.Form;
const FormGroup = FormStyles.FormGroup;
const Label = FormStyles.Label;
const Input = FormStyles.Input;
const Select = FormStyles.Select;
const ErrorMessage = FormStyles.ErrorMessage;
const SubmitButton = FormStyles.PrimaryButton;

interface OrderBookLevel {
  id: number;
  assetType: string;
  price: string; // Decimal은 string으로 반환
  totalAmount: number;
  requestCount: number;
}

export default function BuyApplyPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <Title>모빅 구매 신청</Title>
          <Description>로딩 중...</Description>
        </PageLayout>
      }
    >
      <BuyApplyContent />
    </Suspense>
  );
}

function BuyApplyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") || "free";
  const initialPrice = searchParams.get("price") || "";
  const initialAmount = searchParams.get("amount") || "";
  const assetType = searchParams.get("assetType") || "BMB";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    amount: "",
    price: "",
    priceType: "market", // "market" 또는 "custom"
    branch: "",
  });

  const [lbankKrwPrice, setLbankKrwPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState("");
  const [agreedRisk, setAgreedRisk] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [errors, setErrors] = useState<{
    [key: string]: string;
  }>({});

  // free 모드에서 allowPartial = true, card 모드에서 allowPartial = false
  const allowPartial = mode === "free" ? true : false;

  // LBANK 가격 불러오기
  useEffect(() => {
    if (mode === "free") {
      const fetchPrices = async () => {
        try {
          setIsLoadingPrice(true);
          const response = await fetch("/api/market-prices");
          const data = await response.json();

          if (data.lbankKrwPrice) {
            setLbankKrwPrice(data.lbankKrwPrice);
            // 시장가가 선택되어 있으면 자동으로 가격 설정
            if (formData.priceType === "market") {
              setFormData((prev) => ({
                ...prev,
                price: Math.round(data.lbankKrwPrice / 10000) * 10000 + "",
              }));
            }
          }
        } catch (error) {
          console.error("Error fetching prices:", error);
        } finally {
          setIsLoadingPrice(false);
        }
      };

      fetchPrices();
      const interval = setInterval(fetchPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [mode, formData.priceType]);

  // 쿼리 파라미터로 전달된 초기값 설정
  useEffect(() => {
    if (mode === "card" && initialPrice && initialAmount) {
      setFormData((prev) => ({
        ...prev,
        price: initialPrice,
        amount: initialAmount,
      }));
    }
  }, [mode, initialPrice, initialAmount]);

  // 연락처 포맷팅 함수 (000-0000-0000)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, "");
    const limitedNumbers = numbers.slice(0, 11);
    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(
        3,
        7
      )}-${limitedNumbers.slice(7)}`;
    }
  };

  // 수량 소수점 제한 함수 (소수점 두 자리까지만)
  const formatAmount = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + "." + parts[1].slice(0, 2);
    }
    return cleaned;
  };

  // 호가형 데이터 state 추가 (mode=free일 때만 사용)
  const [orderBookLevels, setOrderBookLevels] = useState<OrderBookLevel[]>([]);
  const [selectedPriceLevel, setSelectedPriceLevel] =
    useState<OrderBookLevel | null>(null);
  const [isLoadingOrderBook, setIsLoadingOrderBook] = useState(false);

  // mode=free일 때 호가형 데이터 불러오기
  useEffect(() => {
    if (mode === "free") {
      const fetchOrderBookLevels = async () => {
        try {
          setIsLoadingOrderBook(true);
          const response = await fetch(
            `/api/otc/orderbook-levels?assetType=${assetType}`
          );
          const data = await response.json();

          if (response.ok && Array.isArray(data)) {
            setOrderBookLevels(data);
            // 쿼리 파라미터로 가격이 전달된 경우 해당 레벨 선택
            if (initialPrice) {
              const level = data.find(
                (l: OrderBookLevel) => l.price === initialPrice
              );
              if (level) {
                setSelectedPriceLevel(level);
                setFormData((prev) => ({
                  ...prev,
                  price: level.price,
                }));
              }
            }
          }
        } catch (error) {
          console.error("Error fetching orderbook levels:", error);
        } finally {
          setIsLoadingOrderBook(false);
        }
      };

      fetchOrderBookLevels();
    }
  }, [mode, assetType, initialPrice]);

  // 가격 선택 핸들러
  const handlePriceSelect = (level: OrderBookLevel) => {
    setSelectedPriceLevel(level);
    setFormData((prev) => ({
      ...prev,
      price: level.price,
      // 수량이 최대값을 초과하면 최대값으로 조정
      amount:
        prev.amount && parseFloat(prev.amount) > level.totalAmount
          ? level.totalAmount.toString()
          : prev.amount,
    }));
  };

  // 수량 변경 핸들러 (최대값 제한)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    const amountNum = parseFloat(formatted);
    const maxAmount = selectedPriceLevel?.totalAmount || Infinity;

    if (amountNum > maxAmount) {
      setErrors((prev) => ({
        ...prev,
        amount: `최대 구매 가능 수량은 ${maxAmount} Mo입니다.`,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      amount: formatted,
    }));

    // 에러 제거
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.amount;
      return newErrors;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 가격 타입이 변경되면 가격 초기화 및 재설정
    if (name === "priceType" && value === "market" && lbankKrwPrice !== null) {
      setFormData((prev) => ({
        ...prev,
        price: Math.round(lbankKrwPrice / 10000) * 10000 + "",
      }));
      setPriceError("");
    } else if (name === "priceType" && value === "custom") {
      setFormData((prev) => ({
        ...prev,
        price: "",
      }));
      setPriceError("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      phone: formatted,
    }));
  };

  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setFormData((prev) => ({
      ...prev,
      price: value,
    }));

    if (value && parseInt(value) % 10000 !== 0) {
      setPriceError("가격은 10,000원 단위로 입력해주세요.");
    } else {
      setPriceError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 에러 초기화
    setErrors({});
    let hasError = false;

    // 필수 필드 검증
    if (!formData.name.trim()) {
      setErrors((prev) => ({ ...prev, name: "성함을 입력해주세요." }));
      hasError = true;
    }

    if (!formData.phone.trim()) {
      setErrors((prev) => ({ ...prev, phone: "연락처를 입력해주세요." }));
      hasError = true;
    } else if (formData.phone.replace(/[^\d]/g, "").length !== 11) {
      setErrors((prev) => ({
        ...prev,
        phone: "올바른 연락처 형식이 아닙니다.",
      }));
      hasError = true;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setErrors((prev) => ({
        ...prev,
        amount: "구매 희망 수량을 입력해주세요.",
      }));
      hasError = true;
    }

    if (mode === "free") {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        setErrors((prev) => ({
          ...prev,
          price: "희망 가격을 입력해주세요.",
        }));
        hasError = true;
      }

      if (
        formData.priceType === "custom" &&
        formData.price &&
        parseInt(formData.price) % 10000 !== 0
      ) {
        setErrors((prev) => ({
          ...prev,
          price: "가격은 10,000원 단위로 입력해주세요.",
        }));
        hasError = true;
      }
    }

    if (!formData.branch) {
      setErrors((prev) => ({
        ...prev,
        branch: "방문할 회관을 선택해주세요.",
      }));
      hasError = true;
    }

    // 동의 체크 검증
    if (!agreedRisk) {
      setErrors((prev) => ({
        ...prev,
        agreedRisk: "보이스피싱 안내 동의는 필수입니다.",
      }));
      hasError = true;
    }

    if (!agreedPrivacy) {
      setErrors((prev) => ({
        ...prev,
        agreedPrivacy: "개인정보 수집 동의는 필수입니다.",
      }));
      hasError = true;
    }

    if (hasError) {
      // 첫 번째 에러로 스크롤
      const firstErrorElement = document.querySelector(
        '[style*="border-color: #ef4444"], .error-message'
      );
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    try {
      // 구매 신청 API 호출
      const response = await fetch("/api/buyer-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          amount: formData.amount,
          price: formData.price,
          branch: formData.branch,
          assetType: assetType,
          agreedRisk: agreedRisk,
          agreedPrivacy: agreedPrivacy,
        }),
      });

      // Content-Type 확인
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Server returned HTML instead of JSON:", text);
        alert(
          `서버 오류가 발생했습니다. (${response.status}) 개발자 콘솔을 확인해주세요.`
        );
        return;
      }

      if (!response.ok) {
        const errorMsg = data.error || "알 수 없는 오류가 발생했습니다.";
        const details = data.details ? `\n\n상세: ${data.details}` : "";
        alert(`신청 실패: ${errorMsg}${details}`);
        return;
      }

      // 성공 처리 - 확인 페이지로 리다이렉트
      const params = new URLSearchParams({
        id: data.id.toString(),
        name: data.name,
        phone: data.phone,
        amount: data.amount.toString(),
        price: data.price.toString(),
        branch: data.branch,
        assetType: assetType,
        mode: mode, // mode는 확인 페이지에서 표시용으로만 사용
      });

      router.push(`/otc/buy/apply/success?${params.toString()}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <PageLayout>
      <Title>모빅 구매 신청</Title>
      <Description>구매 신청서를 작성해주세요.</Description>
      <FormStyles.FormContainer>
        {mode === "card" && (
          <>
            <ModeIndicator>
              카드형 매물 구매 모드 (가격:{" "}
              {initialPrice ? parseInt(initialPrice).toLocaleString() : "N/A"}
              원, 수량: {initialAmount || "N/A"} Mo)
            </ModeIndicator>
            <InfoText
              style={{
                backgroundColor: "#fef3c7",
                border: "1px solid #fbbf24",
                color: "#92400e",
              }}
            >
              이 매물은 일괄 거래 전용이며, 수량과 가격은 판매자가 제시한
              조건으로 고정됩니다.
            </InfoText>
          </>
        )}
        {mode === "free" && (
          <>
            <ModeIndicator>호가형(소액) 구매 모드</ModeIndicator>
            <InfoText>
              호가형에 등록된 판매 신청 중에서 가격과 수량을 선택하여 즉시 구매
              신청할 수 있습니다.
            </InfoText>
          </>
        )}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">성함 *</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="예: 홍길동"
              style={{
                borderColor: errors.name ? "#ef4444" : "#d1d5db",
              }}
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="phone">연락처 *</Label>
            <Input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="예: 010-1234-5678"
              maxLength={13}
              style={{
                borderColor: errors.phone ? "#ef4444" : "#d1d5db",
              }}
            />
            {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
          </FormGroup>

          {/* mode=free일 때 가격 선택 드롭다운 */}
          {mode === "free" && (
            <FormGroup>
              <Label htmlFor="priceSelect">가격 선택 *</Label>
              {isLoadingOrderBook ? (
                <PriceInfo>호가 정보를 불러오는 중...</PriceInfo>
              ) : orderBookLevels.length === 0 ? (
                <PriceInfo
                  style={{
                    backgroundColor: "#fef2f2",
                    borderColor: "#ef4444",
                    color: "#dc2626",
                  }}
                >
                  등록된 호가가 없습니다. 판매 신청이 등록되면 구매할 수
                  있습니다.
                </PriceInfo>
              ) : (
                <>
                  <Select
                    id="priceSelect"
                    value={selectedPriceLevel?.price || ""}
                    onChange={(e) => {
                      const level = orderBookLevels.find(
                        (l) => l.price === e.target.value
                      );
                      if (level) {
                        handlePriceSelect(level);
                      }
                    }}
                    style={{
                      borderColor: errors.price ? "#ef4444" : "#d1d5db",
                    }}
                  >
                    <option value="">가격을 선택하세요</option>
                    {orderBookLevels.map((level) => (
                      <option key={level.id} value={level.price}>
                        {parseFloat(level.price).toLocaleString("ko-KR")}원 (
                        {level.totalAmount} Mo, {level.requestCount}건)
                      </option>
                    ))}
                  </Select>
                  {selectedPriceLevel && (
                    <InfoText style={{ marginTop: "0.5rem" }}>
                      선택한 가격:{" "}
                      {parseFloat(selectedPriceLevel.price).toLocaleString(
                        "ko-KR"
                      )}
                      원
                      <br />
                      사용 가능 수량: {selectedPriceLevel.totalAmount} Mo
                      {selectedPriceLevel.requestCount > 1 && (
                        <> ({selectedPriceLevel.requestCount}건 합산)</>
                      )}
                    </InfoText>
                  )}
                  {errors.price && <ErrorMessage>{errors.price}</ErrorMessage>}
                </>
              )}
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="amount">구매 희망 수량 *</Label>
            <Input
              type="text"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder={
                mode === "free" && selectedPriceLevel
                  ? `최대 ${selectedPriceLevel.totalAmount} Mo까지 입력 가능`
                  : "예: 100.50 (숫자만 입력, 소수점 두 자리까지)"
              }
              inputMode="decimal"
              readOnly={mode === "card"}
              disabled={
                mode === "card" || (mode === "free" && !selectedPriceLevel)
              }
              style={{
                ...(mode === "card" || (mode === "free" && !selectedPriceLevel)
                  ? {
                      backgroundColor: "#f3f4f6",
                      cursor: "not-allowed",
                      color: "#6b7280",
                    }
                  : {}),
                borderColor: errors.amount ? "#ef4444" : "#d1d5db",
              }}
            />
            {errors.amount && <ErrorMessage>{errors.amount}</ErrorMessage>}
            {mode === "free" && selectedPriceLevel && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                최대 {selectedPriceLevel.totalAmount} Mo까지 구매 가능합니다.
              </p>
            )}
            {mode === "card" && (
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  marginTop: "0.25rem",
                }}
              >
                카드형 매물의 수량은 고정되어 있습니다.
              </p>
            )}
          </FormGroup>

          {/* mode=free일 때는 가격 입력 필드 제거 (드롭다운으로 대체) */}
          {mode === "card" && (
            <FormGroup>
              <Label htmlFor="price">희망 가격 *</Label>
              {/* ... 기존 card 모드 가격 표시 ... */}
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="branch">방문할 회관 선택 *</Label>
            <Select
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              style={{
                borderColor: errors.branch ? "#ef4444" : "#d1d5db",
              }}
            >
              <option value="">회관을 선택하세요</option>
              {BRANCH_NAMES.map((branchName) => (
                <option key={branchName} value={branchName}>
                  {branchName}
                </option>
              ))}
              <option value="기타(담당자와 조율)">기타(담당자와 조율)</option>
            </Select>
            {errors.branch && <ErrorMessage>{errors.branch}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label>필수 동의 사항 *</Label>
            <CheckboxContainer
              style={{
                borderColor: errors.agreedRisk ? "#ef4444" : "#d1d5db",
              }}
            >
              <CheckboxInput
                type="checkbox"
                id="agreedRisk"
                checked={agreedRisk}
                onChange={(e) => {
                  setAgreedRisk(e.target.checked);
                  if (e.target.checked) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.agreedRisk;
                      return newErrors;
                    });
                  }
                }}
              />
              <CheckboxLabel htmlFor="agreedRisk">
                보이스피싱 및 불법 자금 관련 안내를 확인하고 동의합니다.
              </CheckboxLabel>
            </CheckboxContainer>
            {errors.agreedRisk && (
              <ErrorMessage>{errors.agreedRisk}</ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <CheckboxContainer
              style={{
                borderColor: errors.agreedPrivacy ? "#ef4444" : "#d1d5db",
              }}
            >
              <CheckboxInput
                type="checkbox"
                id="agreedPrivacy"
                checked={agreedPrivacy}
                onChange={(e) => {
                  setAgreedPrivacy(e.target.checked);
                  if (e.target.checked) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.agreedPrivacy;
                      return newErrors;
                    });
                  }
                }}
              />
              <CheckboxLabel htmlFor="agreedPrivacy">
                개인정보 최소 수집 및 이용에 동의합니다.
              </CheckboxLabel>
            </CheckboxContainer>
            {errors.agreedPrivacy && (
              <ErrorMessage>{errors.agreedPrivacy}</ErrorMessage>
            )}
          </FormGroup>

          <SubmitButton type="submit">구매 신청하기</SubmitButton>
        </Form>
      </FormStyles.FormContainer>
    </PageLayout>
  );
}
