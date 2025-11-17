"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import PageLayout from "@/components/layouts/PageLayout";
import * as FormStyles from "@/components/forms/styles";

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

export default function BuyApplyPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "free";
  const initialPrice = searchParams.get("price") || "";
  const initialAmount = searchParams.get("amount") || "";

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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setFormData((prev) => ({
      ...prev,
      amount: formatted,
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

  const handleSubmit = (e: React.FormEvent) => {
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

    // 제출 데이터 구성
    const submitData = {
      ...formData,
      mode,
      allowPartial,
      agreedRisk,
      agreedPrivacy,
    };

    console.log("Form Data:", submitData);
    alert(JSON.stringify(submitData, null, 2));
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
            <ModeIndicator>일반 구매 모드</ModeIndicator>
            <InfoText>소량 구매가 가능한 일반 구매 신청입니다.</InfoText>
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

          <FormGroup>
            <Label htmlFor="amount">구매 희망 수량 *</Label>
            <Input
              type="text"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleAmountChange}
              placeholder="예: 100.50 (숫자만 입력, 소수점 두 자리까지)"
              inputMode="decimal"
              readOnly={mode === "card"}
              disabled={mode === "card"}
              style={{
                ...(mode === "card"
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

          <FormGroup>
            <Label htmlFor="price">희망 가격 *</Label>
            {mode === "free" && (
              <>
                <RadioGroup>
                  <RadioLabel>
                    <RadioInput
                      type="radio"
                      name="priceType"
                      value="market"
                      checked={formData.priceType === "market"}
                      onChange={handleChange}
                    />
                    시장가
                  </RadioLabel>
                  <RadioLabel>
                    <RadioInput
                      type="radio"
                      name="priceType"
                      value="custom"
                      checked={formData.priceType === "custom"}
                      onChange={handleChange}
                    />
                    사용자 지정
                  </RadioLabel>
                </RadioGroup>

                {formData.priceType === "market" && (
                  <>
                    {isLoadingPrice && lbankKrwPrice === null && (
                      <PriceInfo>LBANK 현재가를 불러오는 중...</PriceInfo>
                    )}
                    {lbankKrwPrice !== null && (
                      <PriceInfo>
                        LBANK 현재가: {lbankKrwPrice.toLocaleString()}원
                        <br />
                        (10,000원 단위로 반올림:{" "}
                        {(
                          Math.round(lbankKrwPrice / 10000) * 10000
                        ).toLocaleString()}
                        원)
                      </PriceInfo>
                    )}
                    <Input
                      type="text"
                      id="price"
                      name="price"
                      value={formData.price}
                      readOnly
                      style={{
                        backgroundColor: "#f3f4f6",
                        cursor: "not-allowed",
                        borderColor: errors.price ? "#ef4444" : "#d1d5db",
                      }}
                    />
                    {errors.price && (
                      <ErrorMessage>{errors.price}</ErrorMessage>
                    )}
                  </>
                )}

                {formData.priceType === "custom" && (
                  <PriceInputWrapper>
                    <PriceInputLabel htmlFor="customPrice">
                      직접 입력 (10,000원 단위)
                    </PriceInputLabel>
                    <Input
                      type="text"
                      id="customPrice"
                      name="customPrice"
                      value={formData.price}
                      onChange={handleCustomPriceChange}
                      placeholder="예: 900000"
                      style={{
                        borderColor: priceError ? "#ef4444" : "#d1d5db",
                      }}
                    />
                    {priceError && <ErrorMessage>{priceError}</ErrorMessage>}
                  </PriceInputWrapper>
                )}
              </>
            )}

            {mode === "card" && (
              <>
                <Input
                  type="text"
                  id="price"
                  name="price"
                  value={
                    formData.price
                      ? parseInt(formData.price).toLocaleString()
                      : ""
                  }
                  readOnly
                  disabled
                  style={{
                    backgroundColor: "#f3f4f6",
                    cursor: "not-allowed",
                    color: "#6b7280",
                    borderColor: errors.price ? "#ef4444" : "#d1d5db",
                  }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    marginTop: "0.25rem",
                  }}
                >
                  카드형 매물의 가격은 고정되어 있습니다.
                </p>
                {errors.price && <ErrorMessage>{errors.price}</ErrorMessage>}
              </>
            )}
          </FormGroup>

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
              <option value="서울 서초">서울 서초</option>
              <option value="광주">광주</option>
              <option value="부산">부산</option>
              <option value="대전">대전</option>
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
