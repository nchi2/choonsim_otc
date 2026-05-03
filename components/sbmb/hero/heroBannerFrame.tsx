"use client";

import styled from "styled-components";
import { T } from "@/lib/sbmb/tokens";

const mobile = "@media (max-width: 767px)";

export const HeroBannerOuter = styled.section`
  width: 100%;
  align-self: stretch;
  background: ${T.heroGradient};
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  position: relative;
`;

export const HeroBannerInner = styled.div`
  width: 100%;
  max-width: ${T.maxWidth};
  padding-top: 112px;
  padding-left: 20px;
  padding-right: 20px;

  ${mobile} {
    padding-top: 100px;
  }
`;
