import styled, { css } from "styled-components";

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 28, 0.55);
  backdrop-filter: blur(2px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;

  @media (min-width: 768px) {
    padding: 32px 16px;
  }
`;

export const ModalContainer = styled.div`
  position: relative;
  width: 100%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: min(90dvh, 760px);

  @media (min-width: 768px) {
    max-width: 720px;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(15, 15, 28, 0.35);
  }
`;

export const ModalCloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(31, 41, 55, 0.06);
  color: #1f2937;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(31, 41, 55, 0.12);
  }

  @media (min-width: 768px) {
    top: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
`;

export const ModalBody = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 24px 20px max(32px, env(safe-area-inset-bottom));

  @media (min-width: 768px) {
    padding: 32px 32px 40px;
  }
`;

export const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FormHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 32px;
`;

export const FormHeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.3;
  letter-spacing: -0.01em;

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
`;

export const FormHeaderSubtitle = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.55;

  @media (min-width: 768px) {
    font-size: 0.95rem;
  }
`;

export const HeaderDivider = styled.hr`
  width: 100%;
  height: 1px;
  margin: 0;
  border: none;
  background: #e5e7eb;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
`;

export const Required = styled.span`
  color: #dc2626;
  font-weight: 700;
`;

export const Optional = styled.span`
  color: #9ca3af;
  font-weight: 500;
  font-size: 0.78rem;
  margin-left: 4px;
`;

const inputBase = css`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #111827;
  background: #ffffff;
  outline: none;
  transition:
    border-color 0.12s ease,
    box-shadow 0.12s ease;

  &:focus {
    border-color: #434392;
    box-shadow: 0 0 0 3px rgba(67, 67, 146, 0.15);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

export const Input = styled.input`
  ${inputBase}
`;

export const TextArea = styled.textarea`
  ${inputBase}
  resize: vertical;
  min-height: 84px;
  font-family: inherit;
`;

export const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const Chip = styled.button<{ $active: boolean }>`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? "#434392" : "#e5e7eb")};
  background: ${(p) => (p.$active ? "#434392" : "#ffffff")};
  color: ${(p) => (p.$active ? "#ffffff" : "#374151")};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.12s ease;

  &:hover {
    border-color: #434392;
  }
`;

export const ErrorText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #dc2626;
  font-weight: 600;
`;

export const HintText = styled.p`
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.45;
`;

export const SubmitButton = styled.button<{ $tone?: "buy" | "sell" }>`
  width: 100%;
  padding: 14px 16px;
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  background: ${(p) => (p.$tone === "sell" ? "#6570C5" : "#A8639F")};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.12s ease, filter 0.12s ease;

  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f3f4f6;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const GuideBox = styled.div`
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  font-size: 0.88rem;
  color: #9a3412;
  line-height: 1.55;
`;

export const PriceStepperRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const StepperBtn = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  color: #374151;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: #434392;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const PriceDisplay = styled.div`
  flex: 1;
  min-width: 120px;
  text-align: center;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
`;

export const SlotGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

export const SlotChip = styled.button<{ $active: boolean; $booked?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 84px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1.5px solid
    ${(p) => (p.$active ? "#434392" : p.$booked ? "#e5e7eb" : "#d1d5db")};
  background: ${(p) =>
    p.$active ? "#434392" : p.$booked ? "#f9fafb" : "#fff"};
  color: ${(p) => (p.$active ? "#fff" : "#374151")};
  cursor: ${(p) => (p.$booked ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.$booked ? 0.65 : 1)};
`;

export const SlotChipTime = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
`;

export const SlotChipMeta = styled.span`
  font-size: 0.68rem;
`;

export const DateSelectButton = styled.button<{ $hasValue: boolean }>`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: ${(p) => (p.$hasValue ? "#111827" : "#9ca3af")};
`;

export const OfficeSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
`;

export const DoneBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0 16px;
`;

export const DoneTitle = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: #111827;
`;

export const DoneText = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.55;
`;
