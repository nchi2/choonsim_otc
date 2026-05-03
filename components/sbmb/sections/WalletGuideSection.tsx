"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";
import styled from "styled-components";
import { IconPlayCircle } from "@/components/sbmb/shared/SbmbIcons";
import { SbmbSectionAnchor } from "@/components/sbmb/shared/SectionCard";
import { T } from "@/lib/sbmb/tokens";

const desktop = "@media (min-width: 768px)";

const HeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;

  ${desktop} {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }
`;

const TitleStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 20px;
  color: ${T.textPrimary};
`;

const Subtitle = styled.p`
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 400;
  font-size: 13px;
  line-height: 1.5;
  color: #6b7280;
`;

const FullViewBtn = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 9999px;
  border: none;
  background: #f3f4f6;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: ${T.primary};
  cursor: pointer;

  &:hover {
    background: #e5e7eb;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  ${desktop} {
    /* 3열 × n행: 마지막 줄이 2개여도 각 카드 너비는 1/3 유지, 좌측 정렬 */
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const CardLink = styled.a`
  position: relative;
  min-width: 0;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  background: ${T.white};
  display: flex;
  flex-direction: column;
`;

const StepBadge = styled.span`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 3px 8px;
  border-radius: 9999px;
  background: linear-gradient(90deg, #4c4598, #8fd8c7);
  color: #ffffff;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.02em;
`;

const ThumbWrap = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  background: #111827;
`;

const PlayOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
`;

const Info = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const VidTitle = styled.span`
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.35;
  color: ${T.textPrimary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ModalRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalBackdrop = styled.button`
  position: absolute;
  inset: 0;
  border: none;
  padding: 0;
  margin: 0;
  background: rgba(17, 24, 39, 0.45);
  cursor: pointer;
`;

const ModalPanel = styled.div`
  position: relative;
  width: 100%;
  max-width: 360px;
  border-radius: 14px;
  background: ${T.white};
  padding: 24px 22px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
`;

const ModalTitle = styled.p`
  margin: 0 0 8px;
  font-family: Inter, system-ui, sans-serif;
  font-weight: 700;
  font-size: 17px;
  color: ${T.textPrimary};
`;

const ModalBody = styled.p`
  margin: 0 0 18px;
  font-family: Inter, system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.55;
  color: ${T.textMuted};
`;

const ModalClose = styled.button`
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: none;
  background: ${T.buttonGradient};
  color: ${T.white};
  font-family: Inter, system-ui, sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
`;

function youtubeIdFromWatchUrl(url: string): string {
  const m =
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ??
    url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? "";
}

const guideVideosRaw = [
  {
    title: "트러스트 월렛 실습1 — 설치 및 지갑생성과 백업",
    url: "https://youtu.be/RGrzFsFwrlM",
    step: 1,
  },
  {
    title: "트러스트 월렛 실습2 — 지갑 들여오기와 토큰 등록",
    url: "https://youtu.be/nl4ai0PgyA4",
    step: 2,
  },
  {
    title: "트러스트 월렛 실습3 — 토큰 전송",
    url: "https://youtu.be/IyqauOjXMGI",
    step: 3,
  },
  {
    title: "유니스왑 실습1 — 지갑 연결과 토큰 스왑",
    url: "https://youtu.be/EjYg4hu5ZHU",
    step: 4,
  },
  {
    title: "유니스왑 실습2 — 유동성 공급",
    url: "https://youtu.be/Zci_KRmeHi0",
    step: 5,
  },
] as const;

const guideVideos = guideVideosRaw.map((v) => {
  const id = youtubeIdFromWatchUrl(v.url);
  return {
    ...v,
    thumbnail: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
  };
});

export default function WalletGuideSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const titleId = useId();

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setModalOpen(false);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [modalOpen, onKeyDown]);

  return (
    <SbmbSectionAnchor id="guide" aria-labelledby="sbmb-wallet-guide-heading">
      <HeaderBlock>
        <TitleStack>
          <Title id="sbmb-wallet-guide-heading">지갑 사용 가이드</Title>
          <Subtitle>
            SBMB 에어드랍 수령 전, 아래 가이드를 순서대로 따라해보세요.
          </Subtitle>
        </TitleStack>
        <FullViewBtn type="button" onClick={() => setModalOpen(true)}>
          전체 보기 →
        </FullViewBtn>
      </HeaderBlock>

      <Grid>
        {guideVideos.map((video) => (
          <CardLink
            key={video.url}
            href={video.url}
            target="_blank"
            rel="noreferrer"
          >
            <StepBadge>STEP {String(video.step).padStart(2, "0")}</StepBadge>
            <ThumbWrap>
              <Image
                src={video.thumbnail}
                alt=""
                fill
                sizes="(max-width: 767px) 100vw, 33vw"
                style={{ objectFit: "cover" }}
              />
              <PlayOverlay>
                <IconPlayCircle size={32} color="rgba(255,255,255,0.92)" />
              </PlayOverlay>
            </ThumbWrap>
            <Info>
              <VidTitle>{video.title}</VidTitle>
            </Info>
          </CardLink>
        ))}
      </Grid>

      {modalOpen ? (
        <ModalRoot role="presentation">
          <ModalBackdrop
            type="button"
            aria-label="닫기"
            onClick={() => setModalOpen(false)}
          />
          <ModalPanel
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <ModalTitle id={titleId}>안내</ModalTitle>
            <ModalBody>준비중입니다.</ModalBody>
            <ModalClose type="button" onClick={() => setModalOpen(false)}>
              확인
            </ModalClose>
          </ModalPanel>
        </ModalRoot>
      ) : null}
    </SbmbSectionAnchor>
  );
}
