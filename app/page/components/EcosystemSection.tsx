"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import styled from "styled-components";
import {
  ECOSYSTEM_GROUPS,
  ECOSYSTEM_SECTION_ANCHOR_ID,
  ECOSYSTEM_YOUTUBE_ANCHOR_ID,
  faviconUrl,
  platformLogo,
  type EcosystemGroup,
  type EcosystemLink,
} from "@/lib/ecosystem-links";
import { YOUTUBE_CHANNELS } from "@/lib/youtube/channels";
import * as S from "../styles";

const DESKTOP_LIMIT = 6;
const MOBILE_LIMIT = 4;

/** 브랜드 로고가 직접 매핑되지 않은(=파비콘 폴백) 외부 링크 — 페이지 메타데이터에서 아이콘 수집 대상 */
const META_ICON_HREFS: string[] = Array.from(
  new Set(
    ECOSYSTEM_GROUPS.flatMap((g) =>
      g.links
        .filter((l) => !l.internal && platformLogo(l.href).kind === "favicon")
        .map((l) => l.href),
    ),
  ),
);

type MetaIconMap = Record<string, string | null>;

/** 대상 페이지 메타데이터 아이콘을 1회 배치 수집 (실패 시 빈 맵 → 구글 파비콘 폴백) */
function useMetaIcons(): MetaIconMap {
  const [icons, setIcons] = useState<MetaIconMap>({});
  useEffect(() => {
    if (META_ICON_HREFS.length === 0) return;
    let cancelled = false;
    const controller = new AbortController();
    fetch("/api/ecosystem-icon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: META_ICON_HREFS }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json && typeof json.results === "object") {
          setIcons(json.results as MetaIconMap);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);
  return icons;
}

function initials(label: string): string {
  const t = label.trim();
  if (!t) return "?";
  const first = Array.from(t)[0] ?? "?";
  return /[a-z]/.test(first) ? first.toUpperCase() : first;
}

/** 좁은 폭(모바일) 여부 — SSR 기본은 데스크탑(false). */
function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

const GROUP_ICON: Record<string, ReactNode> = {
  official: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="m12 3 2.3 4.7 5.2.8-3.7 3.6.9 5.1L12 14.8 7.3 17.2l.9-5.1L4.5 8.5l5.2-.8L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  trade: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 8h13l-3-3M20 16H7l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  participate: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 20s-7-4.3-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.7-7 9-7 9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  community: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3 19a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M21 19a6 6 0 0 0-4-5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  content: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
    </svg>
  ),
  offline: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

/** favicon 종류면 메타데이터 아이콘 우선, 없으면 구글 파비콘으로 폴백한 src 반환 */
function logoSrcFor(link: EcosystemLink, metaIcons: MetaIconMap): string | null {
  if (link.internal) return null;
  const logo = platformLogo(link.href);
  if (logo.kind === "brand") return logo.src;
  if (logo.kind === "favicon") {
    const meta = metaIcons[link.href];
    if (typeof meta === "string" && meta) return meta;
    return faviconUrl(link.href);
  }
  return null;
}

function LinkLogo({
  link,
  metaIcons,
}: {
  link: EcosystemLink;
  metaIcons: MetaIconMap;
}) {
  const [failed, setFailed] = useState(false);
  const src = logoSrcFor(link, metaIcons);
  const isFavicon = !link.internal && platformLogo(link.href).kind === "favicon";

  if (failed || !src) {
    return (
      <FaviconFallback $ours={Boolean(link.ours)}>
        {initials(link.label)}
      </FaviconFallback>
    );
  }
  return (
    <FaviconImg
      src={src}
      alt=""
      $favicon={isFavicon}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function LinkCard({
  link,
  metaIcons,
}: {
  link: EcosystemLink;
  metaIcons: MetaIconMap;
}) {
  const inner = (
    <>
      <LinkLogo link={link} metaIcons={metaIcons} />
      <CardText>
        <CardName>{link.label}</CardName>
        {link.desc ? <CardDesc>{link.desc}</CardDesc> : null}
      </CardText>
    </>
  );

  if (link.internal) {
    return (
      <CardRoot as={Link} href={link.href} $ours={Boolean(link.ours)}>
        {inner}
      </CardRoot>
    );
  }
  return (
    <CardRoot
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      $ours={Boolean(link.ours)}
    >
      {inner}
    </CardRoot>
  );
}

function ChipItem({
  link,
  metaIcons,
}: {
  link: EcosystemLink;
  metaIcons: MetaIconMap;
}) {
  const [failed, setFailed] = useState(false);
  const src = logoSrcFor(link, metaIcons);

  return (
    <ChipLink href={link.href} target="_blank" rel="noopener noreferrer">
      {!failed && src ? (
        <ChipLogo
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : null}
      {link.label}
    </ChipLink>
  );
}

function YoutubeStackCard() {
  const channels = YOUTUBE_CHANNELS;
  const stack = channels.filter((c) => c.avatar).slice(0, 4);
  const extra = Math.max(0, channels.length - stack.length);

  const scrollToVideos = () => {
    const el = document.getElementById(ECOSYSTEM_YOUTUBE_ANCHOR_ID);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <YoutubeCard type="button" onClick={scrollToVideos}>
      <AvatarStack>
        {stack.map((c, i) => (
          <StackAvatar
            key={c.channelId}
            src={c.avatar}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            style={{ zIndex: stack.length - i }}
          />
        ))}
        {extra > 0 ? <StackMore>+{extra}</StackMore> : null}
      </AvatarStack>
      <YoutubeText>
        유튜브 채널 {channels.length}곳 · 최신 영상 모아보기 →
      </YoutubeText>
    </YoutubeCard>
  );
}

function GroupBlock({
  group,
  metaIcons,
}: {
  group: EcosystemGroup;
  metaIcons: MetaIconMap;
}) {
  const [expanded, setExpanded] = useState(false);
  const narrow = useIsNarrow();

  const limit = narrow ? MOBILE_LIMIT : DESKTOP_LIMIT;
  const ytSlots = group.youtube ? 1 : 0;
  const cardLimit = Math.max(0, limit - ytSlots);

  const cardLinks = group.links.filter((l) => !l.chip);
  const chipLinks = group.links.filter((l) => l.chip);

  const totalCount = group.links.length + ytSlots;

  const visibleCards = expanded ? cardLinks : cardLinks.slice(0, cardLimit);
  const hiddenCards = Math.max(0, cardLinks.length - cardLimit);
  const collapsedHidden = hiddenCards + chipLinks.length;
  const hasMore = collapsedHidden > 0;

  return (
    <GroupRoot>
      <GroupHead>
        <GroupIcon aria-hidden>{GROUP_ICON[group.id]}</GroupIcon>
        <GroupTitle>{group.title}</GroupTitle>
        <GroupCount>{totalCount}</GroupCount>
      </GroupHead>

      <CardGrid>
        {group.youtube ? <YoutubeStackCard /> : null}
        {visibleCards.map((link) => (
          <LinkCard key={link.href} link={link} metaIcons={metaIcons} />
        ))}
      </CardGrid>

      {expanded && chipLinks.length > 0 && (
        <ChipRow>
          {chipLinks.map((link) => (
            <ChipItem key={link.href} link={link} metaIcons={metaIcons} />
          ))}
        </ChipRow>
      )}

      {hasMore && (
        <MoreButton
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "접기" : `더보기 (+${collapsedHidden})`}
          <Chevron $open={expanded} aria-hidden>▾</Chevron>
        </MoreButton>
      )}
    </GroupRoot>
  );
}

export default function EcosystemSection() {
  const metaIcons = useMetaIcons();
  return (
    <AnchorWrap id={ECOSYSTEM_SECTION_ANCHOR_ID}>
      <S.Section>
        <S.SectionTitle>BTCMobick 생태계</S.SectionTitle>
        <Subtitle>조회 · 거래 · 커뮤니티 · 콘텐츠를 한곳에서</Subtitle>
        <Groups>
          {ECOSYSTEM_GROUPS.map((group) => (
            <GroupBlock key={group.id} group={group} metaIcons={metaIcons} />
          ))}
        </Groups>
        <ContactNote>
          링크 추가 문의 ·{" "}
          <ContactLink href="mailto:contact@choonsim.com">
            contact@choonsim.com
          </ContactLink>
        </ContactNote>
      </S.Section>
    </AnchorWrap>
  );
}

const AnchorWrap = styled.div`
  scroll-margin-top: 5.5rem;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin: -1.25rem 0 2rem;
  line-height: 1.6;

  @media (min-width: 768px) {
    font-size: 0.9375rem;
  }
`;

const Groups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const GroupRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
`;

const GroupHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const GroupIcon = styled.span`
  display: inline-flex;
  width: 1.25rem;
  height: 1.25rem;
  color: #434392;

  svg {
    width: 100%;
    height: 100%;
  }
`;

const GroupTitle = styled.h3`
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: #111827;
`;

const GroupCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.375rem;
  height: 1.375rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: #eef0fb;
  color: #434392;
  font-size: 0.75rem;
  font-weight: 700;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const CardRoot = styled.a<{ $ours?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 4rem;
  padding: 0.75rem 0.875rem;
  border-radius: 0.75rem;
  background: #ffffff;
  text-decoration: none;
  border: 1px solid ${(p) => (p.$ours ? "#434392" : "#e5e7eb")};
  box-shadow: ${(p) =>
    p.$ours ? "0 2px 10px rgba(67, 67, 146, 0.15)" : "none"};
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    border-color: ${(p) => (p.$ours ? "#434392" : "#c7cbe6")};
    transform: translateY(-1px);
  }
`;

const FaviconImg = styled.img<{ $favicon?: boolean }>`
  flex-shrink: 0;
  width: 2.375rem;
  height: 2.375rem;
  border-radius: 0.5rem;
  object-fit: cover;
  display: block;
  background: ${(p) => (p.$favicon ? "#f3f4f6" : "transparent")};
`;

const FaviconFallback = styled.span<{ $ours?: boolean }>`
  flex-shrink: 0;
  width: 2.375rem;
  height: 2.375rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 800;
  color: ${(p) => (p.$ours ? "#ffffff" : "#4b5563")};
  background: ${(p) => (p.$ours ? "#434392" : "#eef0f5")};
`;

const CardText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
`;

const CardName = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardDesc = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ChipLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  text-decoration: none;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    border-color: #c7cbe6;
    background: #f7f7fc;
  }
`;

const ChipLogo = styled.img`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  object-fit: cover;
  flex-shrink: 0;
`;

const ContactNote = styled.p`
  margin: 2rem 0 0;
  text-align: center;
  font-size: 0.75rem;
  color: #9ca3af;
`;

const ContactLink = styled.a`
  color: #9ca3af;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover {
    color: #6b7280;
  }
`;

const MoreButton = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;

  &:hover {
    color: #434392;
  }
`;

const Chevron = styled.span<{ $open: boolean }>`
  font-size: 0.7rem;
  transition: transform 0.15s ease;
  transform: rotate(${(p) => (p.$open ? "180deg" : "0deg")});
`;

const YoutubeCard = styled.button`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  min-height: 4rem;
  padding: 0.75rem 0.875rem;
  border-radius: 0.75rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    border-color: #c7cbe6;
    transform: translateY(-1px);
  }
`;

const AvatarStack = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
`;

const StackAvatar = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid #ffffff;
  background: #f3f4f6;

  &:not(:first-child) {
    margin-left: -0.625rem;
  }
`;

const StackMore = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  margin-left: -0.625rem;
  background: #434392;
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 700;
  border: 2px solid #ffffff;
`;

const YoutubeText = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;
