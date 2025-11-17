import styled from "styled-components";
import Link from "next/link";

export const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 3rem;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 4rem;
  }
`;

export const OTCSection = styled.section`
  width: 100%;
  max-width: 800px;
  background-color: #f9fafb;
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
    margin-bottom: 3rem;
  }
`;

export const OTCTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
  text-align: center;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 2.5rem;
  }
`;

export const PriceInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-around;
    gap: 2rem;
  }
`;

export const PriceCard = styled.div`
  flex: 1;
  padding: 1.5rem;
  background-color: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  text-align: center;
  transition: all 0.2s;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const PriceLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const PriceValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

export const PriceSubValue = styled.div`
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

export const LoadingText = styled.div`
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  padding: 2rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 3rem;
  }
`;

export const ErrorText = styled.div`
  text-align: center;
  color: #ef4444;
  font-size: 0.875rem;
  padding: 2rem;

  @media (min-width: 768px) {
    font-size: 1rem;
    padding: 3rem;
  }
`;

export const OTCButton = styled(Link)`
  display: block;
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1.25rem 2.5rem;
  }
`;
