import styled from "styled-components";

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

export const Input = styled.input`
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

export const Select = styled.select`
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

export const RadioGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;

  @media (min-width: 768px) {
    gap: 2rem;
  }
`;

export const RadioLabel = styled.label`
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

export const RadioInput = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
`;

export const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
`;

export const PrimaryButton = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: #3b82f6;
  border: none;
  border-radius: 0.375rem;
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

  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }

  @media (min-width: 768px) {
    font-size: 1.125rem;
    padding: 1.25rem 2.5rem;
  }
`;

export const FormContainer = styled.div`
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

export const PriceInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

export const PriceInputLabel = styled.label`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;
