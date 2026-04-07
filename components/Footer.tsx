"use client";

import { Fragment } from "react";
import styled from "styled-components";
import { COMMUNITY_LINKTREE_LIST } from "@/lib/community-linktree";

const FooterContainer = styled.footer`
  width: 100%;
  background-color: #e5e7eb;
  border-top: 2px solid #d1d5db;
  padding: 1rem;
  margin-top: auto;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  background-color: #e5e7eb;
`;

const CommunityLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
`;

const CommunityLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  width: 100%;
  text-align: center;

  @media (min-width: 480px) {
    width: auto;
    margin-right: 0.25rem;
  }
`;

const FooterExternalLink = styled.a`
  font-size: 0.75rem;
  font-weight: 600;
  color: #434392;
  text-decoration: none;
  border-bottom: 1px solid transparent;

  &:hover {
    border-bottom-color: #434392;
  }

  @media (min-width: 768px) {
    font-size: 0.8125rem;
  }
`;

const LinkSep = styled.span`
  color: #d1d5db;
  font-size: 0.75rem;
  user-select: none;

  @media (max-width: 479px) {
    display: none;
  }
`;

const Copyright = styled.p`
  color: #4b5563;
  font-size: 0.75rem;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <FooterContent>
        <CommunityLinks>
          <CommunityLabel>커뮤니티</CommunityLabel>
          {COMMUNITY_LINKTREE_LIST.map((item, i) => (
            <Fragment key={item.href}>
              {i > 0 ? <LinkSep aria-hidden>|</LinkSep> : null}
              <FooterExternalLink
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </FooterExternalLink>
            </Fragment>
          ))}
        </CommunityLinks>
        <Copyright>© {currentYear} Choonsim. All rights reserved.</Copyright>
      </FooterContent>
    </FooterContainer>
  );
}
