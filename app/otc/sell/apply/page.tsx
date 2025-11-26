"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import PageLayout from "@/components/layouts/PageLayout";
import { BRANCH_NAMES } from "@/lib/branch-info";
import { useRouter } from "next/navigation";

// 컬러 팔레트 (구매 신청서와 동일)
const COLORS = {
  primaryBlue: "#E0E7FF",
  secondaryBlue: "#C7D2FE",
  tertiaryBlue: "#A5B4FC",
  quaternaryBlue: "#818CF8",
  quinaryBlue: "#6366F1", // 메인 색상 (primaryPurple 대체)
  senaryBlue: "#4F46E5",
  septenaryBlue: "#4338CA", // 강조 색상 (accentPurple 대체)
  octonaryBlue: "#3730A3",
  nonaryBlue: "#312E81",
  lightPurple: "#f3f1fa",
  borderPurple: "#e8d5f0",
  errorRed: "#ef4444",
  successGreen: "#10b981",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray600: "#4b5563",
  gray700: "#374151",
  gray900: "#111827",
};

// 메인 컨테이너
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${COLORS.lightPurple};
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const MainContent = styled.main`
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`;

// 폼 카드
const FormCard = styled.div`
  background-color: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;

  @media (min-width: 768px) {
    padding: 2.5rem;
    border-radius: 1.25rem;
  }
`;

// 헤더 섹션
const FormHeader = styled.div`
  margin-bottom: 2rem;
`;

const ModeBadge = styled.div`
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: ${COLORS.quinaryBlue};
  color: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 0.625rem 1.25rem;
  }
`;

const FormTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${COLORS.gray900};
  margin-bottom: 0.75rem;

  @media (min-width: 768px) {
    font-size: 2.25rem;
    margin-bottom: 1rem;
  }
`;

const FormDescription = styled.p`
  font-size: 0.875rem;
  color: ${COLORS.gray600};
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

// 가격 정보 박스
const PriceInfo = styled.div`
  padding: 1rem;
  background-color: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 0.5rem;
  color: #1e40af;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 1.25rem;
    margin-bottom: 2rem;
  }
`;

// 입력 필드 섹션
const FormFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${COLORS.gray700};

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const FieldInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 1.5px solid
    ${(props) => (props.$hasError ? COLORS.errorRed : COLORS.gray300)};
  border-radius: 0.5rem;
  background-color: #ffffff;
  transition: all 0.2s;
  min-height: 48px;

  &:focus {
    outline: none;
    border-color: ${(props) =>
      props.$hasError ? COLORS.errorRed : COLORS.quinaryBlue};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(99, 102, 241, 0.1)"};
  }

  &:disabled {
    background-color: ${COLORS.gray100};
    cursor: not-allowed;
    color: ${COLORS.gray600};
  }

  @media (min-width: 768px) {
    padding: 1rem 1.25rem;
    font-size: 1.125rem;
  }
`;

const FieldSelect = styled.select<{ $hasError?: boolean }>`
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 1.5px solid
    ${(props) => (props.$hasError ? COLORS.errorRed : COLORS.gray300)};
  border-radius: 0.5rem;
  background-color: #ffffff;
  transition: all 0.2s;
  min-height: 48px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234b5563' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;

  &:focus {
    outline: none;
    border-color: ${(props) =>
      props.$hasError ? COLORS.errorRed : COLORS.quinaryBlue};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(99, 102, 241, 0.1)"};
  }

  @media (min-width: 768px) {
    padding: 1rem 1.25rem;
    padding-right: 2.5rem;
    font-size: 1.125rem;
  }
`;

const ErrorMessage = styled.div`
  font-size: 0.875rem;
  color: ${COLORS.errorRed};
  margin-top: 0.25rem;
`;

const SuccessMessage = styled.div`
  font-size: 0.875rem;
  color: ${COLORS.successGreen};
  margin-top: 0.25rem;
`;

// 라디오 버튼 그룹
const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const RadioLabel = styled.label<{ $selected?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #ffffff;
  border: 1.5px solid
    ${(props) => (props.$selected ? COLORS.quinaryBlue : COLORS.gray300)};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.quinaryBlue};
    background-color: ${(props) =>
      props.$selected ? "#ffffff" : COLORS.lightPurple};
  }
`;

const RadioInput = styled.input`
  width: 20px;
  height: 20px;
  margin: 0;
  margin-top: 2px;
  cursor: pointer;
  appearance: none;
  border: 2px solid ${COLORS.gray300};
  border-radius: 50%;
  background-color: #ffffff;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s;

  &:checked {
    border-color: ${COLORS.quinaryBlue};
    background-color: ${COLORS.quinaryBlue};
  }

  &:checked::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: white;
  }

  @media (min-width: 768px) {
    width: 24px;
    height: 24px;
    margin-top: 0;

    &:checked::after {
      width: 10px;
      height: 10px;
    }
  }
`;

const RadioContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const RadioTitle = styled.div<{ $selected?: boolean }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => (props.$selected ? COLORS.quinaryBlue : COLORS.gray900)};
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const RadioDescription = styled.div`
  font-size: 0.75rem;
  color: ${COLORS.gray600};
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

// 가격 직접 입력 래퍼
const PriceInputWrapper = styled.div`
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PriceInputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${COLORS.gray600};

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

// 운영 정책 안내문
const PolicyNotice = styled.div`
  background-color: #fef3c7;
  border-left: 4px solid #fbbf24;
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  font-size: 0.875rem;
  color: #92400e;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const PolicyTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #78350f;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  @media (min-width: 768px) {
    font-size: 1rem;

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

const PolicyList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PolicyItem = styled.li`
  font-size: 0.875rem;
  color: #92400e;
  line-height: 1.6;
  padding-left: 1.25rem;
  position: relative;

  &::before {
    content: "•";
    position: absolute;
    left: 0;
    color: #fbbf24;
    font-weight: bold;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const PolicyHighlight = styled.span`
  color: ${COLORS.errorRed};
  font-weight: 600;
`;

// 약관 동의 섹션
const AgreementSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const AgreementTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${COLORS.gray700};
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const AgreementItem = styled.label<{ $hasError?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #ffffff;
  border: 1.5px solid
    ${(props) => (props.$hasError ? COLORS.errorRed : COLORS.gray300)};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${(props) =>
      props.$hasError ? COLORS.errorRed : COLORS.quinaryBlue};
  }
`;

const CustomCheckbox = styled.div<{ $checked: boolean }>`
  width: 20px;
  height: 20px;
  min-width: 20px;
  border: 2px solid
    ${(props) => (props.$checked ? COLORS.quinaryBlue : COLORS.gray300)};
  border-radius: 0.25rem;
  background-color: ${(props) =>
    props.$checked ? COLORS.quinaryBlue : "#ffffff"};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-top: 2px;

  svg {
    width: 14px;
    height: 14px;
    color: white;
    opacity: ${(props) => (props.$checked ? 1 : 0)};
    transition: opacity 0.2s;
  }
`;

const AgreementText = styled.span`
  font-size: 0.875rem;
  color: ${COLORS.gray700};
  line-height: 1.6;
  flex: 1;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const HiddenCheckbox = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: auto;
  width: 20px;
  height: 20px;
  margin: 0;
  cursor: pointer;
  left: 1rem;
  top: 1rem;
  z-index: 1;
`;

// 제출 버튼
const SubmitButton = styled.button<{ $disabled: boolean }>`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: ${(props) =>
    props.$disabled ? COLORS.gray400 : COLORS.septenaryBlue};
  border: none;
  border-radius: 0.5rem;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;
  min-height: 52px;

  &:hover:not(:disabled) {
    background-color: ${COLORS.quinaryBlue};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1.25rem;
  }
`;

// AlertTriangle 아이콘 SVG 컴포넌트
const AlertTriangleIconSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Check 아이콘 SVG 컴포넌트
const CheckIconSVG = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export default function SellApplyPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <PageContainer>
            <MainContent>
              <FormCard>
                <FormTitle>모빅 판매 신청</FormTitle>
                <PriceInfo>로딩 중...</PriceInfo>
              </FormCard>
            </MainContent>
          </PageContainer>
        </PageLayout>
      }
    >
      <SellApplyContent />
    </Suspense>
  );
}

function SellApplyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const assetType = searchParams.get("assetType") || "BMB";

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
  const [priceWarning, setPriceWarning] = useState("");
  const [agreedPolicy, setAgreedPolicy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<Record<string, boolean>>({});

  // LBANK 가격 불러오기
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoadingPrice(true);
        setPriceWarning("");
        const response = await fetch("/api/market-prices");
        const data = await response.json();

        if (data.lbankKrwPrice) {
          setLbankKrwPrice(data.lbankKrwPrice);
        } else {
          setLbankKrwPrice(null);
          if (data.errors?.bithumb) {
            setPriceWarning(
              "현재 가격 정보를 불러올 수 없습니다. 직접 가격을 입력해주세요."
            );
          }
        }

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
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // 연락처 포맷팅 함수
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

  // 수량 소수점 제한 함수
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

  // 실시간 유효성 검사
  useEffect(() => {
    const newValidation: Record<string, boolean> = {};

    // 이름 검증
    if (formData.name.trim()) {
      const namePattern = /^[가-힣]{2,10}$/;
      newValidation.name = namePattern.test(formData.name.trim());
    }

    // 연락처 검증
    if (formData.phone.trim()) {
      const phonePattern = /^\d{3}-\d{4}-\d{4}$/;
      newValidation.phone = phonePattern.test(formData.phone);
    }

    // 수량 검증
    if (formData.amount.trim()) {
      const amountNum = parseFloat(formData.amount);
      newValidation.amount = !isNaN(amountNum) && amountNum > 0;
    }

    // 가격 검증
    if (formData.price.trim()) {
      const priceNum = parseInt(formData.price);
      newValidation.price =
        !isNaN(priceNum) && priceNum > 0 && priceNum % 10000 === 0;
    }

    setValidation(newValidation);
  }, [formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "성함을 입력해주세요.";
    } else if (!validation.name) {
      newErrors.name = "2-10자의 한글만 입력 가능합니다.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "연락처를 입력해주세요.";
    } else if (!validation.phone) {
      newErrors.phone = "올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)";
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "판매 희망 수량을 입력해주세요.";
    } else if (!validation.amount) {
      newErrors.amount = "수량은 0보다 큰 숫자를 입력해주세요.";
    }

    if (!formData.price.trim()) {
      newErrors.price = "희망 가격을 입력하거나 선택해주세요.";
    } else if (!validation.price) {
      if (parseInt(formData.price) % 10000 !== 0) {
        newErrors.price = "가격은 10,000원 단위로 입력해주세요.";
      } else {
        newErrors.price = "가격은 0보다 큰 숫자를 입력해주세요.";
      }
    }

    if (!formData.allowPartial) {
      newErrors.allowPartial = "소량 판매 허용 여부를 선택해주세요.";
    }

    if (!formData.branch) {
      newErrors.branch = "방문할 회관을 선택해주세요.";
    }

    if (!agreedPolicy) {
      newErrors.agreedPolicy = "운영 정책에 동의해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
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
          agreedPolicy: agreedPolicy,
        }),
      });

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

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      phone: formatted,
    }));

    if (errors.phone) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setFormData((prev) => ({
      ...prev,
      amount: formatted,
    }));

    if (errors.amount) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.amount;
        return newErrors;
      });
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      price: value,
    }));
    setUseCustomPrice(false);
    setPriceError("");

    if (errors.price) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.price;
        return newErrors;
      });
    }
  };

  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setFormData((prev) => ({
      ...prev,
      price: value,
    }));
    setUseCustomPrice(true);

    if (value && parseInt(value) % 10000 !== 0) {
      setPriceError("가격은 10,000원 단위로 입력해주세요.");
    } else {
      setPriceError("");
    }

    if (errors.price) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.price;
        return newErrors;
      });
    }
  };

  const generatePriceOptions = () => {
    if (lbankKrwPrice === null) {
      return <option value="">가격 정보를 불러오는 중...</option>;
    }

    const basePrice = Math.round(lbankKrwPrice / 10000) * 10000;
    const options = [];
    const step = 10000;
    const range = 10;

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

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.phone.trim() &&
      formData.amount.trim() &&
      formData.price.trim() &&
      formData.allowPartial &&
      formData.branch &&
      agreedPolicy &&
      Object.keys(errors).length === 0 &&
      Object.values(validation).every((v) => v !== false)
    );
  };

  return (
    <PageLayout>
      <PageContainer>
        <MainContent>
          <FormCard>
            <FormHeader>
              <ModeBadge>판매 신청서 작성</ModeBadge>
              <FormTitle>모빅 판매 신청</FormTitle>
              <FormDescription>
                판매 신청서를 작성해주세요. 모든 항목은 필수 입력 사항입니다.
              </FormDescription>
            </FormHeader>

            <PriceInfo>
              {isLoadingPrice && lbankKrwPrice === null && (
                <div>LBANK 현재가를 불러오는 중...</div>
              )}
              {lbankKrwPrice !== null && (
                <div>
                  LBANK 현재가: {Math.floor(lbankKrwPrice).toLocaleString()}원
                </div>
              )}
              {!isLoadingPrice && lbankKrwPrice === null && priceWarning && (
                <div style={{ color: "#f59e0b", marginTop: "0.5rem" }}>
                  {priceWarning}
                </div>
              )}
            </PriceInfo>

            <form onSubmit={handleSubmit}>
              <FormFields>
                <FormField>
                  <FieldLabel htmlFor="name">성함 *</FieldLabel>
                  <FieldInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="예: 홍길동"
                    $hasError={!!errors.name}
                  />
                  {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
                  {validation.name && !errors.name && formData.name && (
                    <SuccessMessage>✓ 올바른 성함 형식입니다.</SuccessMessage>
                  )}
                </FormField>

                <FormField>
                  <FieldLabel htmlFor="phone">연락처 *</FieldLabel>
                  <FieldInput
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="예: 010-1234-5678"
                    maxLength={13}
                    $hasError={!!errors.phone}
                  />
                  {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
                  {validation.phone && !errors.phone && formData.phone && (
                    <SuccessMessage>✓ 올바른 연락처 형식입니다.</SuccessMessage>
                  )}
                </FormField>

                <FormField>
                  <FieldLabel htmlFor="amount">판매 희망 수량 *</FieldLabel>
                  <FieldInput
                    type="text"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="예: 100.50 (숫자만 입력, 소수점 두 자리까지)"
                    inputMode="decimal"
                    $hasError={!!errors.amount}
                  />
                  {errors.amount && (
                    <ErrorMessage>{errors.amount}</ErrorMessage>
                  )}
                  {validation.amount && !errors.amount && formData.amount && (
                    <SuccessMessage>✓ 올바른 수량 형식입니다.</SuccessMessage>
                  )}
                </FormField>

                <FormField>
                  <FieldLabel htmlFor="price">희망 가격 *</FieldLabel>
                  <FieldSelect
                    id="price"
                    name="price"
                    value={useCustomPrice ? "" : formData.price}
                    onChange={handlePriceChange}
                    disabled={
                      isLoadingPrice || lbankKrwPrice === null || useCustomPrice
                    }
                    $hasError={!!errors.price || !!priceError}
                  >
                    <option value="">
                      {isLoadingPrice
                        ? "가격 정보를 불러오는 중..."
                        : lbankKrwPrice === null
                        ? "가격 정보를 불러올 수 없습니다. 직접 입력을 사용해주세요."
                        : "가격을 선택하세요 (10,000원 단위)"}
                    </option>
                    {generatePriceOptions()}
                  </FieldSelect>

                  <PriceInputWrapper>
                    <PriceInputLabel htmlFor="customPrice">
                      또는 직접 입력 (10,000원 단위)
                    </PriceInputLabel>
                    <FieldInput
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
                      disabled={isLoadingPrice}
                      $hasError={!!errors.price || !!priceError}
                    />
                    {priceError && <ErrorMessage>{priceError}</ErrorMessage>}
                    {errors.price && !priceError && (
                      <ErrorMessage>{errors.price}</ErrorMessage>
                    )}
                  </PriceInputWrapper>
                </FormField>

                <FormField>
                  <FieldLabel>소량 판매 허용 여부 *</FieldLabel>
                  <RadioGroup>
                    <RadioLabel
                      $selected={formData.allowPartial === "true"}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          allowPartial: "true",
                        }));
                        if (errors.allowPartial) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.allowPartial;
                            return newErrors;
                          });
                        }
                      }}
                    >
                      <RadioInput
                        type="radio"
                        name="allowPartial"
                        value="true"
                        checked={formData.allowPartial === "true"}
                        onChange={handleChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <RadioContent>
                        <RadioTitle
                          $selected={formData.allowPartial === "true"}
                        >
                          허용 (호가형 등록)
                        </RadioTitle>
                        <RadioDescription>
                          호가형(소액 거래 허용)에 등록됩니다.
                        </RadioDescription>
                      </RadioContent>
                    </RadioLabel>
                    <RadioLabel
                      $selected={formData.allowPartial === "false"}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          allowPartial: "false",
                        }));
                        if (errors.allowPartial) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.allowPartial;
                            return newErrors;
                          });
                        }
                      }}
                    >
                      <RadioInput
                        type="radio"
                        name="allowPartial"
                        value="false"
                        checked={formData.allowPartial === "false"}
                        onChange={handleChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <RadioContent>
                        <RadioTitle
                          $selected={formData.allowPartial === "false"}
                        >
                          비허용 (카드형 매물 등록)
                        </RadioTitle>
                        <RadioDescription>
                          전체 수량 일괄 판매만 가능합니다.
                        </RadioDescription>
                      </RadioContent>
                    </RadioLabel>
                  </RadioGroup>
                  {errors.allowPartial && (
                    <ErrorMessage>{errors.allowPartial}</ErrorMessage>
                  )}
                </FormField>

                <FormField>
                  <FieldLabel htmlFor="branch">방문할 회관 선택 *</FieldLabel>
                  <FieldSelect
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    $hasError={!!errors.branch}
                  >
                    <option value="">회관을 선택하세요</option>
                    {BRANCH_NAMES.map((branchName) => {
                      const isAvailable = branchName === "서초 모빅회관" || branchName === "수원 모빅회관";
                      return (
                        <option
                          key={branchName}
                          value={branchName}
                          disabled={!isAvailable}
                        >
                          {branchName}
                        </option>
                      );
                    })}
                  </FieldSelect>
                  {errors.branch && (
                    <ErrorMessage>{errors.branch}</ErrorMessage>
                  )}
                </FormField>
              </FormFields>

              <AgreementSection>
                <AgreementTitle>아래 내용을 확인해주세요. *</AgreementTitle>
                <PolicyNotice>
                  <PolicyTitle>
                    <AlertTriangleIconSVG />
                    운영 정책 안내
                  </PolicyTitle>
                  <PolicyList>
                    <PolicyItem>
                      판매 신청 이후 가격/수량은 그 주 일요일 오전 09:00까지
                      고정되며,{" "}
                      <PolicyHighlight>
                        취소/변경은 일요일까지 불가능합니다.
                      </PolicyHighlight>
                    </PolicyItem>
                    <PolicyItem>
                      일요일 09:00 이후 운영자가 연락을 드리며
                      판매의사(유지/변경/취소 여부)를 확인합니다.
                    </PolicyItem>
                    <PolicyItem>
                      연락이 닿지 않을 경우, 호가에서 제외되어 대기됩니다.
                    </PolicyItem>
                  </PolicyList>
                </PolicyNotice>
                <AgreementItem
                  $hasError={!!errors.agreedPolicy}
                  onClick={(e) => {
                    e.preventDefault();
                    const target = e.target as HTMLElement;
                    if (target.tagName !== "INPUT") {
                      setAgreedPolicy(!agreedPolicy);
                      if (!agreedPolicy) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.agreedPolicy;
                          return newErrors;
                        });
                      }
                    }
                  }}
                >
                  <HiddenCheckbox
                    type="checkbox"
                    checked={agreedPolicy}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAgreedPolicy(e.target.checked);
                      if (e.target.checked) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.agreedPolicy;
                          return newErrors;
                        });
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                  <CustomCheckbox $checked={agreedPolicy}>
                    <CheckIconSVG />
                  </CustomCheckbox>
                  <AgreementText>해당 운영 정책을 이해했습니다.</AgreementText>
                </AgreementItem>
                {errors.agreedPolicy && (
                  <ErrorMessage>{errors.agreedPolicy}</ErrorMessage>
                )}
              </AgreementSection>

              <SubmitButton type="submit" $disabled={!isFormValid()}>
                신청하기
              </SubmitButton>
            </form>
          </FormCard>
        </MainContent>
      </PageContainer>
    </PageLayout>
  );
}
