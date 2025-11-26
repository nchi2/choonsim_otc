"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import PageLayout from "@/components/layouts/PageLayout";
import { BRANCH_NAMES } from "@/lib/branch-info";
import { useRouter } from "next/navigation";

// 컬러 팔레트
const COLORS = {
  primaryPurple: "#8b63a8",
  accentPurple: "#a8639f",
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
  margin-top: 60px;

  @media (min-width: 768px) {
    padding: 2rem;
    margin-top: 60px;
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
  background-color: ${COLORS.primaryPurple};
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

// 고정값 필드
const FixedValueFields = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FixedField = styled.div`
  position: relative;
  padding: 1rem;
  background-color: ${COLORS.gray50};
  border: 1px solid ${COLORS.gray300};
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const LockIcon = styled.div`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: ${COLORS.gray400};

  svg {
    width: 100%;
    height: 100%;
  }
`;

const FixedFieldContent = styled.div`
  flex: 1;
`;

const FixedFieldLabel = styled.div`
  font-size: 0.75rem;
  color: ${COLORS.gray600};
  margin-bottom: 0.25rem;
`;

const FixedFieldValue = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${COLORS.gray900};

  @media (min-width: 768px) {
    font-size: 1.125rem;
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
      props.$hasError ? COLORS.errorRed : COLORS.primaryPurple};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(139, 99, 168, 0.1)"};
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
      props.$hasError ? COLORS.errorRed : COLORS.primaryPurple};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(139, 99, 168, 0.1)"};
  }

  option:disabled {
    color: #9ca3af;
    background-color: #f3f4f6;
    cursor: not-allowed;
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

// 자산 종류 버튼 그룹
const AssetTypeGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const AssetTypeButton = styled.button<{ $active: boolean }>`
  flex: 1;
  min-width: 80px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid
    ${(props) => (props.$active ? COLORS.primaryPurple : COLORS.gray300)};
  border-radius: 0.5rem;
  background-color: ${(props) =>
    props.$active ? COLORS.primaryPurple : "#ffffff"};
  color: ${(props) => (props.$active ? "#ffffff" : COLORS.gray700)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.primaryPurple};
    background-color: ${(props) =>
      props.$active ? COLORS.accentPurple : COLORS.lightPurple};
  }

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 0.875rem 1.25rem;
  }
`;

// 안내 박스
const NoticeBox = styled.div`
  background-color: ${COLORS.lightPurple};
  border-left: 4px solid ${COLORS.primaryPurple};
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
`;

const NoticeTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${COLORS.gray900};
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const NoticeList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const NoticeItem = styled.li`
  font-size: 0.875rem;
  color: ${COLORS.gray700};
  line-height: 1.6;
  padding-left: 1.25rem;
  position: relative;

  &::before {
    content: "•";
    position: absolute;
    left: 0;
    color: ${COLORS.primaryPurple};
    font-weight: bold;
  }

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
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
      props.$hasError ? COLORS.errorRed : COLORS.primaryPurple};
  }
`;

const CustomCheckbox = styled.div<{ $checked: boolean }>`
  width: 20px;
  height: 20px;
  min-width: 20px;
  border: 2px solid
    ${(props) => (props.$checked ? COLORS.primaryPurple : COLORS.gray300)};
  border-radius: 0.25rem;
  background-color: ${(props) =>
    props.$checked ? COLORS.primaryPurple : "#ffffff"};
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
    props.$disabled ? COLORS.gray400 : COLORS.accentPurple};
  border: none;
  border-radius: 0.5rem;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s;
  min-height: 52px;

  &:hover:not(:disabled) {
    background-color: ${COLORS.primaryPurple};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 99, 168, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1.25rem;
  }
`;

// 호가형 전용 스타일
const OrderBookSelect = styled(FieldSelect)`
  margin-bottom: 0.5rem;
`;

const OrderBookInfo = styled.div`
  padding: 0.875rem;
  background-color: ${COLORS.lightPurple};
  border: 1px solid ${COLORS.borderPurple};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: ${COLORS.gray700};
  line-height: 1.6;
  margin-top: 0.5rem;
`;

const LoadingMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: ${COLORS.gray600};
  font-size: 0.875rem;
`;

const EmptyMessage = styled.div`
  padding: 1rem;
  text-align: center;
  color: ${COLORS.errorRed};
  font-size: 0.875rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
`;

interface OrderBookLevel {
  id: number;
  assetType: string;
  price: string;
  totalAmount: number;
  requestCount: number;
}

// Lock 아이콘 SVG 컴포넌트
const LockIconSVG = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
      clipRule="evenodd"
    />
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

export default function BuyApplyPage() {
  return (
    <Suspense
      fallback={
        <PageLayout>
          <PageContainer>
            <MainContent>
              <FormCard>
                <FormTitle>모빅 구매 신청</FormTitle>
                <LoadingMessage>로딩 중...</LoadingMessage>
              </FormCard>
            </MainContent>
          </PageContainer>
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
  const initialAssetType = searchParams.get("assetType") || "BMB";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    amount: "",
    price: "",
    priceType: "market",
    branch: "",
  });

  const [assetType, setAssetType] = useState(initialAssetType);
  const [lbankKrwPrice, setLbankKrwPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState("");
  const [agreedRisk, setAgreedRisk] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [validation, setValidation] = useState<{ [key: string]: boolean }>({});

  const [orderBookLevels, setOrderBookLevels] = useState<OrderBookLevel[]>([]);
  const [selectedPriceLevel, setSelectedPriceLevel] =
    useState<OrderBookLevel | null>(null);
  const [isLoadingOrderBook, setIsLoadingOrderBook] = useState(false);

  const assetTypes = ["BMB", "MOVL", "WBMB", "SBMB"];

  // 연락처 포맷팅 및 실시간 검증
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

  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/[^\d]/g, "");
    if (numbers.length === 0) return { valid: false, message: "" };
    if (numbers.length !== 11) {
      return { valid: false, message: "연락처는 11자리 숫자여야 합니다." };
    }
    if (!numbers.startsWith("010")) {
      return { valid: false, message: "010으로 시작하는 번호만 가능합니다." };
    }
    return { valid: true, message: "올바른 연락처 형식입니다." };
  };

  // 성함 검증
  const validateName = (name: string) => {
    if (name.length === 0) return { valid: false, message: "" };
    if (name.length < 2 || name.length > 10) {
      return { valid: false, message: "성함은 2-10자로 입력해주세요." };
    }
    if (!/^[가-힣]+$/.test(name)) {
      return { valid: false, message: "한글만 입력 가능합니다." };
    }
    return { valid: true, message: "올바른 성함 형식입니다." };
  };

  // 수량 포맷팅
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

  // LBANK 가격 불러오기 (free 모드)
  useEffect(() => {
    if (mode === "free") {
      const fetchPrices = async () => {
        try {
          setIsLoadingPrice(true);
          const response = await fetch("/api/market-prices");
          const data = await response.json();

          if (data.lbankKrwPrice) {
            setLbankKrwPrice(data.lbankKrwPrice);
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

  // 호가형 데이터 불러오기
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
      amount:
        prev.amount && parseFloat(prev.amount) > level.totalAmount
          ? level.totalAmount.toString()
          : prev.amount,
    }));
  };

  // 수량 변경 핸들러
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

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.amount;
      return newErrors;
    });
  };

  // 이름 변경 핸들러 (실시간 검증)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, name: value }));

    const validationResult = validateName(value);
    if (value.length > 0) {
      setValidation((prev) => ({ ...prev, name: validationResult.valid }));
      if (!validationResult.valid) {
        setErrors((prev) => ({ ...prev, name: validationResult.message }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.name;
          return newErrors;
        });
      }
    } else {
      setValidation((prev) => ({ ...prev, name: false }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.name;
        return newErrors;
      });
    }
  };

  // 연락처 변경 핸들러 (실시간 검증)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev) => ({ ...prev, phone: formatted }));

    const validationResult = validatePhone(formatted);
    if (formatted.length > 0) {
      setValidation((prev) => ({ ...prev, phone: validationResult.valid }));
      if (!validationResult.valid) {
        setErrors((prev) => ({ ...prev, phone: validationResult.message }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      }
    } else {
      setValidation((prev) => ({ ...prev, phone: false }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "priceType" && value === "market" && lbankKrwPrice !== null) {
      setFormData((prev) => ({
        ...prev,
        price: Math.round(lbankKrwPrice / 10000) * 10000 + "",
      }));
      setPriceError("");
    } else if (name === "priceType" && value === "custom") {
      setFormData((prev) => ({ ...prev, price: "" }));
      setPriceError("");
    }
  };

  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setFormData((prev) => ({ ...prev, price: value }));

    if (value && parseInt(value) % 10000 !== 0) {
      setPriceError("가격은 10,000원 단위로 입력해주세요.");
    } else {
      setPriceError("");
    }
  };

  // 제출 가능 여부 확인
  const isFormValid = () => {
    if (!formData.name.trim() || !validation.name) return false;
    if (!formData.phone.trim() || !validation.phone) return false;
    if (!formData.amount || parseFloat(formData.amount) <= 0) return false;
    if (mode === "free" && (!formData.price || parseFloat(formData.price) <= 0))
      return false;
    if (!formData.branch) return false;
    if (!assetType) return false;
    if (!agreedRisk || !agreedPrivacy) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors({});
    let hasError = false;

    // 검증
    if (!formData.name.trim()) {
      setErrors((prev) => ({ ...prev, name: "성함을 입력해주세요." }));
      hasError = true;
    } else if (!validation.name) {
      hasError = true;
    }

    if (!formData.phone.trim()) {
      setErrors((prev) => ({ ...prev, phone: "연락처를 입력해주세요." }));
      hasError = true;
    } else if (!validation.phone) {
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

    if (!assetType) {
      setErrors((prev) => ({
        ...prev,
        assetType: "자산 종류를 선택해주세요.",
      }));
      hasError = true;
    }

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
      const firstErrorElement = document.querySelector(
        '[style*="border-color: #ef4444"]'
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
        branch: data.branch,
        assetType: assetType,
        mode: mode,
      });

      router.push(`/otc/buy/apply/success?${params.toString()}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <PageLayout>
      <PageContainer>
        <MainContent>
          <FormCard>
            <FormHeader>
              {mode === "card" && <ModeBadge>카드형 매물 구매 모드</ModeBadge>}
              {mode === "free" && <ModeBadge>호가형(소액) 구매 모드</ModeBadge>}
              <FormTitle>구매 신청서 작성</FormTitle>
              <FormDescription>
                등록된 판매 건에 한해서만 구매신청이 가능합니다.
                <br />
                {mode === "card"
                  ? "판매자가 제시한 가격과 수량으로만 거래되는 카드형 매물입니다."
                  : "호가형에 등록된 판매 신청 중에서 가격과 수량을 선택하여 즉시 구매 신청할 수 있습니다."}
              </FormDescription>
            </FormHeader>

            <form onSubmit={handleSubmit}>
              {/* 고정값 필드 (card 모드만) */}
              {mode === "card" && initialPrice && initialAmount && (
                <FixedValueFields>
                  <FixedField>
                    <LockIcon>
                      <LockIconSVG />
                    </LockIcon>
                    <FixedFieldContent>
                      <FixedFieldLabel>거래 가격</FixedFieldLabel>
                      <FixedFieldValue>
                        {parseInt(initialPrice).toLocaleString("ko-KR")}원
                      </FixedFieldValue>
                    </FixedFieldContent>
                  </FixedField>
                  <FixedField>
                    <LockIcon>
                      <LockIconSVG />
                    </LockIcon>
                    <FixedFieldContent>
                      <FixedFieldLabel>거래 수량</FixedFieldLabel>
                      <FixedFieldValue>{initialAmount} Mo</FixedFieldValue>
                    </FixedFieldContent>
                  </FixedField>
                </FixedValueFields>
              )}

              {/* 안내 박스 */}
              {mode === "card" && (
                <NoticeBox>
                  <NoticeTitle>⚠️ 카드형 매물 안내</NoticeTitle>
                  <NoticeList>
                    <NoticeItem>
                      이 매물은 일괄 거래 전용이며, 수량과 가격은 판매자가
                      제시한 조건으로 고정됩니다.
                    </NoticeItem>
                    <NoticeItem>
                      구매 신청 시 즉시 거래가 진행되며, 조건 변경이
                      불가능합니다.
                    </NoticeItem>
                    <NoticeItem>
                      신청 전 가격과 수량을 다시 한번 확인해주세요.
                    </NoticeItem>
                  </NoticeList>
                </NoticeBox>
              )}

              <FormFields>
                {/* 성함 입력 */}
                <FormField>
                  <FieldLabel htmlFor="name">성함 *</FieldLabel>
                  <FieldInput
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="예: 홍길동"
                    $hasError={!!errors.name}
                  />
                  {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
                  {validation.name && !errors.name && formData.name && (
                    <SuccessMessage>✓ 올바른 성함 형식입니다.</SuccessMessage>
                  )}
                </FormField>

                {/* 연락처 입력 */}
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

                {/* 자산 종류 선택 */}
                <FormField>
                  <FieldLabel>자산 종류 *</FieldLabel>
                  <AssetTypeGroup>
                    {assetTypes.map((type) => (
                      <AssetTypeButton
                        key={type}
                        type="button"
                        $active={assetType === type}
                        onClick={() => {
                          setAssetType(type);
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.assetType;
                            return newErrors;
                          });
                        }}
                      >
                        {type}
                      </AssetTypeButton>
                    ))}
                  </AssetTypeGroup>
                  {errors.assetType && (
                    <ErrorMessage>{errors.assetType}</ErrorMessage>
                  )}
                </FormField>

                {/* 호가형 가격 선택 */}
                {mode === "free" && (
                  <FormField>
                    <FieldLabel htmlFor="priceSelect">가격 선택 *</FieldLabel>
                    {isLoadingOrderBook ? (
                      <LoadingMessage>
                        호가 정보를 불러오는 중...
                      </LoadingMessage>
                    ) : orderBookLevels.length === 0 ? (
                      <EmptyMessage>
                        등록된 호가가 없습니다. 판매 신청이 등록되면 구매할 수
                        있습니다.
                      </EmptyMessage>
                    ) : (
                      <>
                        <OrderBookSelect
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
                          $hasError={!!errors.price}
                        >
                          <option value="">가격을 선택하세요</option>
                          {orderBookLevels.map((level) => (
                            <option key={level.id} value={level.price}>
                              {parseFloat(level.price).toLocaleString("ko-KR")}
                              원 ({level.totalAmount} Mo, {level.requestCount}
                              건)
                            </option>
                          ))}
                        </OrderBookSelect>
                        {selectedPriceLevel && (
                          <OrderBookInfo>
                            선택한 가격:{" "}
                            {parseFloat(
                              selectedPriceLevel.price
                            ).toLocaleString("ko-KR")}
                            원
                            <br />
                            사용 가능 수량: {selectedPriceLevel.totalAmount} Mo
                            {selectedPriceLevel.requestCount > 1 && (
                              <> ({selectedPriceLevel.requestCount}건 합산)</>
                            )}
                          </OrderBookInfo>
                        )}
                        {errors.price && (
                          <ErrorMessage>{errors.price}</ErrorMessage>
                        )}
                      </>
                    )}
                  </FormField>
                )}

                {/* 수량 입력 */}
                <FormField>
                  <FieldLabel htmlFor="amount">구매 희망 수량 *</FieldLabel>
                  <FieldInput
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
                      mode === "card" ||
                      (mode === "free" && !selectedPriceLevel)
                    }
                    $hasError={!!errors.amount}
                  />
                  {errors.amount && (
                    <ErrorMessage>{errors.amount}</ErrorMessage>
                  )}
                  {mode === "free" && selectedPriceLevel && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: COLORS.gray600,
                        marginTop: "0.25rem",
                      }}
                    >
                      최대 {selectedPriceLevel.totalAmount} Mo까지 구매
                      가능합니다.
                    </p>
                  )}
                  {mode === "card" && (
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: COLORS.gray600,
                        marginTop: "0.25rem",
                      }}
                    >
                      카드형 매물의 수량은 고정되어 있습니다.
                    </p>
                  )}
                </FormField>

                {/* 회관 선택 */}
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
                      const isAvailable =
                        branchName === "서초 모빅회관" ||
                        branchName === "수원 모빅회관";
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

              {/* 약관 동의 섹션 */}
              <AgreementSection>
                <AgreementTitle>아래 내용을 확인해주세요. *</AgreementTitle>
                <AgreementItem
                  $hasError={!!errors.agreedRisk}
                  onClick={(e) => {
                    e.preventDefault();
                    // 체크박스 영역이 아닌 텍스트 영역 클릭 시에만 처리
                    const target = e.target as HTMLElement;
                    if (target.tagName !== "INPUT") {
                      setAgreedRisk(!agreedRisk);
                      if (!agreedRisk) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.agreedRisk;
                          return newErrors;
                        });
                      }
                    }
                  }}
                >
                  <HiddenCheckbox
                    type="checkbox"
                    checked={agreedRisk}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAgreedRisk(e.target.checked);
                      if (e.target.checked) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.agreedRisk;
                          return newErrors;
                        });
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                  <CustomCheckbox $checked={agreedRisk}>
                    <CheckIconSVG />
                  </CustomCheckbox>
                  <AgreementText>
                    불법 자금 입금 방지를 위해, 타 플랫폼에서 판매 이력이 있는
                    경우 이용이 불가능합니다.
                  </AgreementText>
                </AgreementItem>
                {errors.agreedRisk && (
                  <ErrorMessage>{errors.agreedRisk}</ErrorMessage>
                )}

                <AgreementItem
                  $hasError={!!errors.agreedPrivacy}
                  onClick={(e) => {
                    e.preventDefault();
                    // 체크박스 영역이 아닌 텍스트 영역 클릭 시에만 처리
                    const target = e.target as HTMLElement;
                    if (target.tagName !== "INPUT") {
                      setAgreedPrivacy(!agreedPrivacy);
                      if (!agreedPrivacy) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.agreedPrivacy;
                          return newErrors;
                        });
                      }
                    }
                  }}
                >
                  <HiddenCheckbox
                    type="checkbox"
                    checked={agreedPrivacy}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAgreedPrivacy(e.target.checked);
                      if (e.target.checked) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.agreedPrivacy;
                          return newErrors;
                        });
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  />
                  <CustomCheckbox $checked={agreedPrivacy}>
                    <CheckIconSVG />
                  </CustomCheckbox>
                  <AgreementText>
                    신청 후 운영자의 연락을 받아 회관 방문 일시를 정해주세요.
                  </AgreementText>
                </AgreementItem>
                {errors.agreedPrivacy && (
                  <ErrorMessage>{errors.agreedPrivacy}</ErrorMessage>
                )}
              </AgreementSection>

              {/* 제출 버튼 */}
              <SubmitButton type="submit" $disabled={!isFormValid()}>
                구매 신청하기
              </SubmitButton>
            </form>
          </FormCard>
        </MainContent>
      </PageContainer>
    </PageLayout>
  );
}
