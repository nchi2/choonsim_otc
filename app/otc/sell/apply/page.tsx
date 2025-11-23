"use client";

import { useState, useEffect, Suspense } from "react";
import styled from "styled-components";
import PageLayout from "@/components/layouts/PageLayout";
import * as FormStyles from "@/components/forms/styles";
import { BRANCH_NAMES } from "@/lib/branch-info";
import { useRouter, useSearchParams } from "next/navigation";

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 3rem;
  }
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
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1.25rem;
  }
`;

// 공통 컴포넌트 사용
const Form = FormStyles.Form;
const FormGroup = FormStyles.FormGroup;
const Label = FormStyles.Label;
const Input = FormStyles.Input;
const Select = FormStyles.Select;
const RadioGroup = FormStyles.RadioGroup;
const RadioLabel = FormStyles.RadioLabel;
const RadioInput = FormStyles.RadioInput;
const ErrorMessage = FormStyles.ErrorMessage;
const SubmitButton = styled(FormStyles.PrimaryButton)``;

const FormContainer = styled.div`
  width: 100%;
  max-width: 600px;

  @media (min-width: 768px) {
    max-width: 800px;
  }
`;

// 운영 정책 안내문 스타일 추가
const PolicyNotice = styled.div`
  background-color: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #92400e;
  line-height: 1.6;

  @media (min-width: 768px) {
    padding: 1.25rem;
    font-size: 1rem;
  }
`;

const PolicyTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #78350f;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
`;

const PolicyList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  list-style-type: disc;
`;

const PolicyItem = styled.li`
  margin-bottom: 0.5rem;
`;

// 강조 텍스트 스타일 추가
const PolicyHighlight = styled.span`
  color: #dc2626;
  font-weight: 600;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const CheckboxInput = styled.input`
  margin-top: 0.25rem;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: #111827;
  cursor: pointer;
  line-height: 1.5;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

function SellApplyContent() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    amount: "",
    price: "",
    allowPartial: "",
    branch: "",
  });

  const [lbankKrwPrice, setLbankKrwPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [priceWarning, setPriceWarning] = useState(""); // 추가: 가격 경고 메시지
  const [agreedPolicy, setAgreedPolicy] = useState(false); // 운영 정책 동의 state 추가

  const [errors, setErrors] = useState<Record<string, string>>({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const assetType = searchParams.get("assetType") || "BMB";

  // LBANK 가격 불러오기
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoadingPrice(true);
        setPriceWarning(""); // 경고 초기화
        const response = await fetch("/api/market-prices");
        const data = await response.json();

        if (data.lbankKrwPrice) {
          setLbankKrwPrice(data.lbankKrwPrice);
        } else {
          // 가격을 가져올 수 없어도 직접 입력은 가능하도록 null로 설정
          setLbankKrwPrice(null);

          // 경고 메시지 설정
          if (data.errors?.bithumb) {
            setPriceWarning(
              "현재 가격 정보를 불러올 수 없습니다. 직접 가격을 입력해주세요."
            );
          }
        }

        // 에러가 있으면 콘솔에 로그
        if (data.errors) {
          console.warn("가격 정보 가져오기 경고:", data.errors);
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
        setLbankKrwPrice(null);
        setPriceWarning(
          "가격 정보를 불러올 수 없습니다. 직접 가격을 입력해주세요."
        );
      } finally {
        setIsLoadingPrice(false);
      }
    };

    fetchPrices();
    // 30초마다 업데이트
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // 연락처 포맷팅 함수 (000-0000-0000)
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, "");

    // 11자리까지만 허용
    const limitedNumbers = numbers.slice(0, 11);

    // 포맷팅
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
    // 숫자와 소수점만 허용
    const cleaned = value.replace(/[^\d.]/g, "");

    // 소수점이 여러 개인 경우 첫 번째만 허용
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }

    // 소수점 두 자리까지만
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + "." + parts[1].slice(0, 2);
    }

    return cleaned;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 성함 검증
    if (!formData.name.trim()) {
      newErrors.name = "성함을 입력해주세요.";
    }

    // 연락처 검증
    if (!formData.phone.trim()) {
      newErrors.phone = "연락처를 입력해주세요.";
    } else {
      // 연락처 형식 검증 (000-0000-0000)
      const phonePattern = /^\d{3}-\d{4}-\d{4}$/;
      if (!phonePattern.test(formData.phone)) {
        newErrors.phone = "올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)";
      }
    }

    // 수량 검증
    if (!formData.amount.trim()) {
      newErrors.amount = "판매 희망 수량을 입력해주세요.";
    } else {
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = "수량은 0보다 큰 숫자를 입력해주세요.";
      }
    }

    // 가격 검증
    if (!formData.price.trim()) {
      newErrors.price = "희망 가격을 입력하거나 선택해주세요.";
    } else {
      const priceNum = parseInt(formData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = "가격은 0보다 큰 숫자를 입력해주세요.";
      } else if (priceNum % 10000 !== 0) {
        newErrors.price = "가격은 10,000원 단위로 입력해주세요.";
      }
    }

    // 소량 판매 허용 여부 검증
    if (!formData.allowPartial) {
      newErrors.allowPartial = "소량 판매 허용 여부를 선택해주세요.";
    }

    // 회관 선택 검증
    if (!formData.branch) {
      newErrors.branch = "방문할 회관을 선택해주세요.";
    }

    // 운영 정책 동의 검증 추가
    if (!agreedPolicy) {
      newErrors.agreedPolicy = "운영 정책에 동의해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // 유효성 검사 실패 시 첫 번째 에러 필드로 스크롤
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }
      return;
    }

    try {
      const response = await fetch("/api/seller-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          amount: formData.amount,
          price: formData.price,
          allowPartial: formData.allowPartial,
          branch: formData.branch,
          assetType: assetType,
          agreedPolicy: agreedPolicy, // agreedPolicy 추가
        }),
      });

      // Content-Type 확인
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // HTML 응답인 경우 (에러 페이지)
        const text = await response.text();
        console.error("Server returned HTML instead of JSON:", text);
        alert(
          `서버 오류가 발생했습니다. (${response.status}) 개발자 콘솔을 확인해주세요.`
        );
        return;
      }

      if (!response.ok) {
        // 에러 응답 처리
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
        allowPartial: data.allowPartial.toString(),
        branch: data.branch,
        assetType: assetType,
      });

      router.push(`/otc/sell/apply/success?${params.toString()}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 연락처 전용 핸들러
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      phone: formatted,
    }));
  };

  // 수량 전용 핸들러
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setFormData((prev) => ({
      ...prev,
      amount: formatted,
    }));
  };

  // 가격 전용 핸들러 (Select)
  const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      price: value,
    }));
    setUseCustomPrice(false);
    setPriceError("");
  };

  // 직접 입력 가격 핸들러
  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, ""); // 숫자만
    setFormData((prev) => ({
      ...prev,
      price: value,
    }));
    setUseCustomPrice(true);

    // 만원 단위 검증
    if (value && parseInt(value) % 10000 !== 0) {
      setPriceError("가격은 10,000원 단위로 입력해주세요.");
    } else {
      setPriceError("");
    }
  };

  // 가격 옵션 생성 (LBANK BMB 가격 기준, 위아래 10개씩)
  const generatePriceOptions = () => {
    if (lbankKrwPrice === null) {
      return <option value="">가격 정보를 불러오는 중...</option>;
    }

    const basePrice = Math.round(lbankKrwPrice / 10000) * 10000; // 만원 단위로 반올림
    const options = [];
    const step = 10000;
    const range = 10; // 위아래 10개씩

    // 낮은 가격부터 높은 가격 순서로 (Select에서 아래로 갈수록 낮은 가격)
    for (let i = range; i >= -range; i--) {
      const price = basePrice + i * step;
      if (price > 0) {
        const isCurrentPrice = price === basePrice;
        options.push(
          <option key={price} value={price}>
            {price.toLocaleString()}원 {isCurrentPrice ? "(현재가)" : ""}
          </option>
        );
      }
    }
    return options;
  };

  return (
    <PageLayout>
      <Title>모빅 판매 신청</Title>
      <PriceInfo>
        {isLoadingPrice &&
          lbankKrwPrice === null &&
          "LBANK 현재가를 불러오는 중..."}
        {lbankKrwPrice !== null &&
          `LBANK 현재가: ${Math.floor(lbankKrwPrice).toLocaleString()}원`}
        {!isLoadingPrice && lbankKrwPrice === null && priceWarning && (
          <div style={{ color: "#f59e0b", marginTop: "0.5rem" }}>
            {priceWarning}
          </div>
        )}
      </PriceInfo>
      <FormContainer>
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
              style={{ borderColor: errors.name ? "#ef4444" : "#d1d5db" }}
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
              style={{ borderColor: errors.phone ? "#ef4444" : "#d1d5db" }}
            />
            {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="amount">판매 희망 수량 *</Label>
            <Input
              type="text"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder="예: 100.50 (숫자만 입력, 소수점 두 자리까지)"
              inputMode="decimal"
              style={{ borderColor: errors.amount ? "#ef4444" : "#d1d5db" }}
            />
            {errors.amount && <ErrorMessage>{errors.amount}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="price">희망 가격 *</Label>
            <Select
              id="price"
              name="price"
              value={useCustomPrice ? "" : formData.price}
              onChange={handlePriceChange}
              disabled={
                isLoadingPrice || lbankKrwPrice === null || useCustomPrice
              }
              style={{ borderColor: errors.price ? "#ef4444" : "#d1d5db" }}
            >
              <option value="">
                {isLoadingPrice
                  ? "가격 정보를 불러오는 중..."
                  : lbankKrwPrice === null
                  ? "가격 정보를 불러올 수 없습니다. 직접 입력을 사용해주세요."
                  : "가격을 선택하세요 (10,000원 단위)"}
              </option>
              {generatePriceOptions()}
            </Select>

            <FormStyles.PriceInputWrapper>
              <FormStyles.PriceInputLabel htmlFor="customPrice">
                또는 직접 입력 (10,000원 단위)
              </FormStyles.PriceInputLabel>
              <Input
                type="text"
                id="customPrice"
                name="customPrice"
                value={
                  useCustomPrice
                    ? parseInt(formData.price || "0").toLocaleString()
                    : ""
                }
                onChange={handleCustomPriceChange}
                placeholder="예: 100000"
                // 빗썸이 실패해도 직접 입력은 가능하도록 disabled 조건 수정
                disabled={isLoadingPrice}
                style={{
                  borderColor:
                    errors.price || priceError ? "#ef4444" : "#d1d5db",
                }}
              />
              {priceError && <ErrorMessage>{priceError}</ErrorMessage>}
              {errors.price && !priceError && (
                <ErrorMessage>{errors.price}</ErrorMessage>
              )}
            </FormStyles.PriceInputWrapper>
          </FormGroup>

          <FormGroup>
            <Label>소량 판매 허용 여부 *</Label>
            <RadioGroup>
              <RadioLabel>
                <RadioInput
                  type="radio"
                  name="allowPartial"
                  value="true"
                  checked={formData.allowPartial === "true"}
                  onChange={handleChange}
                />
                허용
              </RadioLabel>
              <RadioLabel>
                <RadioInput
                  type="radio"
                  name="allowPartial"
                  value="false"
                  checked={formData.allowPartial === "false"}
                  onChange={handleChange}
                />
                비허용
              </RadioLabel>
            </RadioGroup>
            {errors.allowPartial && (
              <ErrorMessage>{errors.allowPartial}</ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="branch">방문할 회관 선택 *</Label>
            <Select
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              style={{ borderColor: errors.branch ? "#ef4444" : "#d1d5db" }}
            >
              <option value="">회관을 선택하세요</option>
              {BRANCH_NAMES.map((branchName) => (
                <option key={branchName} value={branchName}>
                  {branchName}
                </option>
              ))}
            </Select>
            {errors.branch && <ErrorMessage>{errors.branch}</ErrorMessage>}
          </FormGroup>

          {/* 운영 정책 안내문 추가 */}
          <PolicyNotice>
            <PolicyTitle>📋 운영 정책 안내</PolicyTitle>
            <PolicyList>
              <PolicyItem>
                판매 신청 이후 가격/수량은 그 주 일요일 오전 09:00까지 고정되며,{" "}
                <PolicyHighlight>
                  취소/변경은 일요일까지 불가능합니다.
                </PolicyHighlight>
              </PolicyItem>
              <PolicyItem>
                일요일 09:00 이후 운영자가 연락을 드리며 판매의사(유지/변경/취소
                여부)를 확인합니다.
              </PolicyItem>
              <PolicyItem>
                연락이 닿지 않을 경우, 호가에서 제외되어 대기됩니다.
              </PolicyItem>
            </PolicyList>
          </PolicyNotice>

          {/* 운영 정책 동의 체크박스 추가 */}
          <CheckboxContainer>
            <CheckboxInput
              type="checkbox"
              id="agreedPolicy"
              checked={agreedPolicy}
              onChange={(e) => setAgreedPolicy(e.target.checked)}
              style={{
                borderColor: errors.agreedPolicy ? "#ef4444" : "#d1d5db",
              }}
            />
            <CheckboxLabel htmlFor="agreedPolicy">
              해당 운영 정책을 이해했습니다 *
            </CheckboxLabel>
          </CheckboxContainer>
          {errors.agreedPolicy && (
            <ErrorMessage style={{ marginTop: "-1rem", marginBottom: "1rem" }}>
              {errors.agreedPolicy}
            </ErrorMessage>
          )}

          <SubmitButton type="submit">신청하기</SubmitButton>
        </Form>
      </FormContainer>
    </PageLayout>
  );
}

// 로딩 컴포넌트
const LoadingFallback = () => (
  <PageLayout>
    <Title>모빅 판매 신청</Title>
    <PriceInfo>로딩 중...</PriceInfo>
  </PageLayout>
);

export default function SellApplyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SellApplyContent />
    </Suspense>
  );
}
