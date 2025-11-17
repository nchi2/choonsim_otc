"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 3rem;
  }
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 800px;
  background-color: #f9fafb;
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #111827;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (min-width: 768px) {
    padding: 0.875rem;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #374151;
  cursor: pointer;
`;

const RadioInput = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
`;

const Select = styled.select`
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #111827;
  cursor: pointer;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (min-width: 768px) {
    padding: 0.875rem;
  }
`;

const SubmitButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #10b981;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #059669;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1.25rem 2.5rem;
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

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
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

export default function SellApplyPage() {
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

  // LBANK 가격 불러오기
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoadingPrice(true);
        const response = await fetch("/api/market-prices");
        const data = await response.json();

        if (data.lbankKrwPrice) {
          setLbankKrwPrice(data.lbankKrwPrice);
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    alert(JSON.stringify(formData, null, 2));
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
    <PageContainer>
      <Header />
      <MainContent>
        <Title>판매 신청</Title>
        {isLoadingPrice && lbankKrwPrice === null && (
          <PriceInfo>LBANK 현재가를 불러오는 중...</PriceInfo>
        )}
        {lbankKrwPrice !== null && (
          <PriceInfo>
            LBANK 현재가: {lbankKrwPrice.toLocaleString()}원
          </PriceInfo>
        )}
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
              />
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
              />
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
              />
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
              >
                <option value="">
                  {isLoadingPrice
                    ? "가격 정보를 불러오는 중..."
                    : "가격을 선택하세요 (10,000원 단위)"}
                </option>
                {generatePriceOptions()}
              </Select>

              <PriceInputWrapper>
                <PriceInputLabel htmlFor="customPrice">
                  또는 직접 입력 (10,000원 단위)
                </PriceInputLabel>
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
                  disabled={isLoadingPrice || lbankKrwPrice === null}
                />
                {priceError && <ErrorMessage>{priceError}</ErrorMessage>}
              </PriceInputWrapper>
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
            </FormGroup>

            <FormGroup>
              <Label htmlFor="branch">방문할 회관 선택 *</Label>
              <Select
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
              >
                <option value="">회관을 선택하세요</option>
                <option value="서울">서울</option>
                <option value="광주">광주</option>
                <option value="부산">부산</option>
                <option value="대전">대전</option>
              </Select>
            </FormGroup>

            <SubmitButton type="submit">신청하기</SubmitButton>
          </Form>
        </FormContainer>
      </MainContent>
      <Footer />
    </PageContainer>
  );
}
