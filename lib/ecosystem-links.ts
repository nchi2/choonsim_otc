/**
 * BTCMobick 생태계 링크 — linktr.ee/Mobick·btcmobick 를 점진 대체하는 정식 모음.
 * URL은 linktree 원본에서 교차 검증한 값만 사용한다(임의 추측 금지).
 * 용도별 7그룹: official / info / trade / participate / community / content / offline.
 * 그룹 내 배열 순서 = 화면 노출 순서(앞 항목이 더보기 없이 먼저 보인다).
 */

export type EcosystemGroupId =
  | "official"
  | "info"
  | "trade"
  | "participate"
  | "community"
  | "content"
  | "offline";

export interface EcosystemLink {
  label: string;
  href: string;
  /** 카드 한 줄 설명 */
  desc?: string;
  /** 우리 서비스(강조 테두리) */
  ours?: boolean;
  /** 내부 라우트(/otc 등) — 같은 탭, rel 불필요 */
  internal?: boolean;
  /** 더보기 펼침 시 카드가 아니라 작은 칩(알약)으로 표시 */
  chip?: boolean;
  /** 커스텀 아이콘 경로(public 기준). 지정 시 파비콘/이니셜 대신 사용 */
  iconSrc?: string;
}

export interface EcosystemGroup {
  id: EcosystemGroupId;
  /** 소제목 */
  title: string;
  links: EcosystemLink[];
  /** content 그룹: 유튜브 아바타 스택 카드를 첫 항목으로 렌더 */
  youtube?: boolean;
}

/** YouTube 영상 섹션 스크롤 타겟 id (콘텐츠 그룹 → 영상 섹션 이동) */
export const ECOSYSTEM_YOUTUBE_ANCHOR_ID = "ecosystem-youtube";

/** 메인 생태계 섹션 앵커 id */
export const ECOSYSTEM_SECTION_ANCHOR_ID = "btcmobick-ecosystem";

export const ECOSYSTEM_GROUPS: EcosystemGroup[] = [
  {
    id: "official",
    title: "공식",
    links: [
      {
        label: "BTCMobick 공식 홈페이지",
        href: "https://btcmobick.org/ko",
        desc: "공식 사이트",
      },
      {
        label: "Mobick Explorer",
        href: "http://blockchain.mobick.info/",
        desc: "블록 탐색기",
      },

      {
        label: "Linktree",
        href: "https://linktr.ee/mobick",
        desc: "공식 링크 모음",
      },
      // 참여 그룹에서 병합
      { label: "BMBSwap", href: "https://bmbswap.org", desc: "WBMB 스왑" },
    ],
  },
  {
    id: "participate",
    title: "참여",
    links: [
      // SBMB: 앱 내 SBMB 현황 페이지로 연결(추정). 다른 URL이면 교체.
      {
        label: "SBMB",
        href: "/sbmb",
        desc: "고액권 · 콘솔 토큰화",
        ours: true,
        internal: true,
        iconSrc: "/logo/Logo_SBMB.svg",
      },
      // 공식 그룹에서 이동
      {
        label: "2모의 기적",
        href: "https://miracle2mo.com/",
        desc: "2모의 기적 공식",
      },
      {
        label: "Harvest MOVN",
        href: "https://harvest-movn.com/",
        desc: "10모의 기적 공식",
      },
    ],
  },
  {
    id: "info",
    title: "플랫폼/정보",
    links: [
      {
        label: "CoinMarketCap",
        href: "https://coinmarketcap.com/currencies/btcmobick",
        desc: "BMB 시세",
      },
      {
        label: "모빅경제",
        href: "https://www.mobickeconomy.com/",
        desc: "비트모빅 / 경제 뉴스",
      },
      {
        label: "모비커들의 놀이터",
        href: "https://mobickers.oopy.io/",
        desc: "정보 허브",
      },
      {
        label: "모빅베어 블로그",
        href: "https://mobickbear.com/creator",
        desc: "정보 공유 블로그",
      },

      { label: "BKRS", href: "https://bkrs.io", desc: "피드식 SNS 커뮤니티" },

      {
        label: "EVM 스캐너",
        href: "/scanner",
        desc: "EVM 지갑 잔고 조회",
        ours: true,
        internal: true,
      },
      {
        label: "Rich List",
        href: "https://mobickcharts.com",
        desc: "Top 500 주소",
      },
      // 분류 확인 필요: 다른 그룹으로 이동 가능 (정보 허브 — community/content 가능)

      {
        label: "해시넷 위키",
        href: "https://wiki1.kr/index.php/%EB%B9%84%ED%8A%B8%EB%AA%A8%EB%B9%85",
        desc: "비트모빅 백과",
      },
      // 커뮤니티 그룹에서 이동
      {
        label: "WeLoveMobick",
        href: "https://welovemobick.com",
        desc: "모빅 커뮤니티",
      },
    ],
  },
  {
    id: "trade",
    title: "거래",
    links: [
      {
        label: "춘심 OTC",
        href: "/otc",
        desc: "10모의 기적 참여 지원",
        ours: true,
        internal: true,
        iconSrc: "/choonsim_character.png",
      },

      {
        label: "LBANK",
        href: "https://www.lbank.com/trade/bmb_usdt",
        desc: "BMB/USDT 페어 제공",
      },
      { label: "모빅매니아", href: "https://mobickmania.com/", desc: "P2P" },
      {
        label: "언블록",
        href: "https://p2p.unblock.co.kr/#/main",
        desc: "P2P (일시중단)",
      },
    ],
  },

  {
    id: "community",
    title: "커뮤니티",
    links: [
      // 카드(기본 노출): 춘심 대화방 2 + 디스코드 + 네이버 카페
      {
        label: "춘심 대화방 1",
        href: "https://open.kakao.com/o/gq3NvqFf",
        desc: "카카오톡",
      },
      {
        label: "춘심 대화방 2",
        href: "https://open.kakao.com/o/gl7msrmg",
        desc: "카카오톡",
      },
      {
        label: "디스코드",
        href: "https://discord.com/invite/btcmobickhub",
        desc: "Discord",
      },
      {
        label: "네이버 카페",
        href: "https://cafe.naver.com/mobick",
        desc: "네이버 카페",
      },
      // 칩(더보기 펼침 시): 나머지 카톡방·텔레그램 등
      {
        label: "모태버스",
        href: "https://open.kakao.com/o/gCV0EQaf",
        chip: true,
      },
      {
        label: "BTCMBK Telegram",
        href: "https://t.me/BTCMBK",
        chip: true,
      },
      {
        label: "btcmobickers Telegram",
        href: "https://t.me/btcmobickers",
        chip: true,
      },
      {
        label: "비트모빅 수다방",
        href: "https://open.kakao.com/o/g4R3y4yg",
        chip: true,
      },
      {
        label: "모빅맥시멀리스트",
        href: "https://open.kakao.com/o/gnHkYMHf",
        chip: true,
      },
      {
        label: "자유토론방",
        href: "https://open.kakao.com/o/g29X4jHf",
        chip: true,
      },
      {
        label: "백모클럽",
        href: "https://open.kakao.com/o/gWek9Ytg",
        chip: true,
      },
      // 참여 그룹에서 병합
      {
        label: "모빅비즈라운지",
        href: "https://open.kakao.com/o/gMtizvqg",
        chip: true,
      },
      // 거래 그룹 카톡방에서 병합
      {
        label: "MOBICK P2P 마켓 1",
        href: "https://open.kakao.com/o/gYZzInAf",
        chip: true,
      },
      {
        label: "MOBICK P2P 마켓 2",
        href: "https://open.kakao.com/o/gIpbBhlg",
        chip: true,
      },
      {
        label: "춘심 종이지갑 P2P",
        href: "https://open.kakao.com/o/gCTpDGng",
        chip: true,
      },
      // 오프라인 그룹에서 병합
      {
        label: "서울·경기 동남부 사랑방",
        href: "https://open.kakao.com/o/gqn9gDYf",
        chip: true,
      },
      {
        label: "대구·경북",
        href: "https://open.kakao.com/o/gHvV32Hf",
        chip: true,
      },
    ],
  },
  {
    id: "content",
    title: "콘텐츠",
    youtube: true,
    links: [
      // {
      //   label: "흰고래의 비트모빅 이야기",
      //   href: "https://blog.naver.com/btcmobicker",
      //   desc: "네이버 블로그",
      // },
      {
        label: "REA의 비트모빅",
        href: "https://blog.naver.com/rea_btcmobick",
        desc: "네이버 블로그",
      },
      {
        label: "레이첼의 크립토산책",
        href: "https://m.blog.naver.com/rachelbmb?tab=1",
        desc: "네이버 블로그",
      },
    ],
  },
  {
    id: "offline",
    title: "오프라인",
    links: [
      {
        label: "전국의 모빅회관",
        href: "https://mobickers.oopy.io/mobick_hall",
        desc: "지부 안내",
      },
      {
        label: "전국 모빅회관 지도",
        href: "https://map.naver.com/p/favorite/sharedPlace/folder/8b017adc79d74ab2ade26bc24e70c61f?c=7.00,0,0,0,dh",
        desc: "네이버 지도",
      },
      // TODO: 서초 사무실 카드 — 넣을지 미정. 주소/지도 링크는 lib/branch-info.ts 참고.
    ],
  },
];

/**
 * 도메인 파비콘 URL. 외부 링크 카드 아이콘 폴백용. 실패 시 컴포넌트에서 이니셜 폴백.
 * 내부 라우트는 null 을 돌려 이니셜/브랜드 표시.
 */
export function faviconUrl(href: string): string | null {
  try {
    const u = new URL(href, "https://choonsim.com");
    if (!u.protocol.startsWith("http")) return null;
    if (u.hostname === "choonsim.com") return null;
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

/**
 * 플랫폼 로고 매핑. public/brand/ 의 공식 브랜드 로고(변형 금지)를 우선 쓰고,
 * 매핑이 없으면 도메인 파비콘으로 폴백한다. 파일/파비콘이 없으면 컴포넌트가
 * 이니셜로 폴백한다(깨진 이미지 금지).
 */
export type PlatformLogo =
  | { kind: "brand"; src: string; alt: string }
  | { kind: "favicon"; src: string }
  | { kind: "youtube" }
  | { kind: "none" };

export function platformLogo(href: string): PlatformLogo {
  try {
    const u = new URL(href, "https://choonsim.com");
    const host = u.hostname.toLowerCase();
    if (host === "open.kakao.com") {
      return { kind: "brand", src: "/logo/Logo_Kakao.png", alt: "카카오톡" };
    }
    if (host === "t.me" || host === "telegram.me") {
      return { kind: "brand", src: "/icon_telegram.png", alt: "텔레그램" };
    }
    if (host === "discord.com" || host === "discord.gg") {
      return { kind: "brand", src: "/logo/Logo_Discord.webp", alt: "디스코드" };
    }
    if (host === "blog.naver.com" || host === "m.blog.naver.com") {
      return {
        kind: "brand",
        src: "/logo/Logo_Naver_blog.png",
        alt: "네이버 블로그",
      };
    }
    if (host === "cafe.naver.com") {
      return {
        kind: "brand",
        src: "/logo/Logo_Naver_cafe.png",
        alt: "네이버 카페",
      };
    }
    if (host.endsWith("youtube.com") || host === "youtu.be") {
      return { kind: "youtube" };
    }
    const fav = faviconUrl(href);
    return fav ? { kind: "favicon", src: fav } : { kind: "none" };
  } catch {
    return { kind: "none" };
  }
}
