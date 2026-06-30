"use client";

import styled from "styled-components";
import {
  CONTACT_EMAIL,
  MIRACLE10_APPLY_SUSPENDED_MESSAGE,
  MIRACLE10_APPLY_SUSPENDED_TITLE,
} from "./apply10mo.constants";
import {
  ModalBody,
  ModalCloseButton,
  ModalContainer,
  ModalOverlay,
  SubmitButton,
} from "./otcModalStyles";

interface Apply10MoSuspendedDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function Apply10MoSuspendedDialog({
  open,
  onClose,
}: Apply10MoSuspendedDialogProps) {
  if (!open) return null;

  return (
    <ModalOverlay
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="miracle10-suspended-title"
    >
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalCloseButton type="button" onClick={onClose} aria-label="닫기">
          ×
        </ModalCloseButton>
        <ModalBody>
          <Wrap>
            <Icon aria-hidden="true">⏸</Icon>
            <Title id="miracle10-suspended-title">
              {MIRACLE10_APPLY_SUSPENDED_TITLE}
            </Title>
            <Message>{MIRACLE10_APPLY_SUSPENDED_MESSAGE}</Message>
            <Contact>
              문의:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </Contact>
            <SubmitButton type="button" onClick={onClose}>
              확인
            </SubmitButton>
          </Wrap>
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
  padding: 0.5rem 0 0.25rem;
`;

const Icon = styled.div`
  font-size: 2rem;
  line-height: 1;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #111827;
`;

const Message = styled.p`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.55;
  color: #4b5563;
  max-width: 28rem;
`;

const Contact = styled.p`
  margin: 0.25rem 0 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;

  a {
    color: #4338ca;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;
