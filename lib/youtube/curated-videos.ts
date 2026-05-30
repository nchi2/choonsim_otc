// cspell:disable
/**
 * 운영자가 직접 큐레이션한 카테고리별 영상 목록.
 *
 * - "전체보기"는 RSS 자동 수집(`/api/youtube/latest`)을 사용하므로 여기에는 없다.
 * - 항목은 `scripts/fill-curated-videos.mjs`로 oEmbed 메타를 1회 추출해 채운다.
 *   ※ 런타임(페이지 요청)에서는 절대 외부에 추가 호출하지 말 것 — 정적 상수로만 사용.
 *
 * cspell은 파일 단위로 끈다 — videoId(11자 임의 식별자)가 계속 늘어나는 데이터
 * 파일이라 단어 단위 등록은 의미 없음. (영상 메타 외 일반 텍스트 변경 시 주의)
 */

export type CuratedCategoryId =
  | "highdenom"
  | "sbmb"
  | "miracle10"
  | "miracle2";

export interface CuratedCategory {
  id: CuratedCategoryId;
  label: string;
}

/** 탭 표시 순서 — UI는 맨 앞에 "전체보기"를 별도 추가해 5개 탭으로 노출. */
export const CURATED_CATEGORIES: readonly CuratedCategory[] = [
  { id: "highdenom", label: "고액권·콘솔" },
  { id: "sbmb", label: "SBMB" },
  { id: "miracle10", label: "10모의 기적" },
  { id: "miracle2", label: "2모의 기적" },
] as const;

export interface CuratedVideo {
  videoId: string;
  title: string;
  channelTitle?: string;
  publishedAt?: string;
}

/**
 * 카테고리별 큐레이션 목록. 신규 항목 추가 시 `scripts/fill-curated-videos.mjs`로
 * URL → 메타 변환 후 이 객체에 붙여넣으면 된다.
 */
export const CURATED: Record<CuratedCategoryId, CuratedVideo[]> = {
  highdenom: [
    {
      videoId: "xkU-TV7hppA",
      title:
        "20250927 대구모빅회관 뉴비교육 4주차 정액권, 콘솔 이해하기 (뽀로로)",
      channelTitle: "대구모빅회관",
    },
    {
      videoId: "pR2Qm_QDFYM",
      title:
        "고액권 최종 안내! (+콘솔 에어드랍 추가분배 안내 + pdf 받아가세요)",
      channelTitle: "모디너리 Mordinary",
    },
    {
      videoId: "KhEaeCkjYlU",
      title:
        "비트모빅 고액권 발표 [ 모빅콘솔 추가 정보 / 정액권은 바로 채우자 ] 수정본",
      channelTitle: "B급감성 모비고",
    },
    {
      videoId: "aQzADs3XEEg",
      title: "비트모빅 고액권 & 모빅 콘솔 | 고래사냥 및 공공재 물량 분배계획",
      channelTitle: "오태민의 비트모빅 BTCmobick",
    },
    {
      videoId: "7Uk_naSwDdU",
      title: "비트모빅 영구채권 Q&A",
      channelTitle: "오태민의 비트모빅 BTCmobick",
    },
    {
      videoId: "klyVablK1WQ",
      title:
        "뉴비를 위한 디파이형 영구채권, 모빅콘솔 아젠다10 — 9/15(일) 오태버스 커뮤니티 글요약",
      channelTitle: "모빅리엘",
    },
    {
      videoId: "wnpMYZCfTWQ",
      title: "뉴비를 위한 비트모빅 정액권 지갑과 콘솔 Q&A — 9/14(토) 오태버스 라방 내용 요약",
      channelTitle: "모빅리엘",
    },
    {
      videoId: "M7HdaJopAes",
      title: "비트모빅 당장 투자해야 하는 이유 [ 모빅콘솔 2% 이자율의 힘 ]",
      channelTitle: "B급감성 모비고",
    },
    {
      videoId: "WwRjUIpsCDo",
      title: "비트모빅 1모 콘솔 [ 부자가 원하는 자산은? ]",
      channelTitle: "B급감성 모비고",
    },
  ],
  sbmb: [
    {
      videoId: "0ldddDRVrbA",
      title:
        "3억짜리 표 한 장으로 끝. 왜 2026년 지금 SBMB를 시작해야 할까? | 비트모빅 | 오태민 | SBMB",
      channelTitle: "블랙조",
    },
    {
      videoId: "xsr82eC9JkQ",
      title: "춘심팀 SBMB 서초회관 강의 요약 편집",
      channelTitle: "창민",
    },
    {
      videoId: "ut9UZJSOJD8",
      title: "SBMB, 비트모빅 콘솔을 포기했던 사람에게 열린 마지막 문 (ft. 10모로 200모 이율)",
      channelTitle: "블랙조",
    },
    {
      videoId: "1nTQ0jhdcqI",
      title: "트러스트월렛 사용 방법 2편 (SBMB/WBMB EVM 지갑 등록하는 방법)",
      channelTitle: "오션페이지",
    },
    {
      videoId: "ujJj0EDu4N8",
      title: "트러스트월렛 사용 방법 1편 (SBMB/WBMB EVM 지갑 등록하는 방법)",
      channelTitle: "오션페이지",
    },
    {
      videoId: "gJrNetWOSho",
      title: "모빅콘솔과 SBMB",
      channelTitle: "BMB NEXUS",
    },
    {
      videoId: "7qga10TV7Do",
      title: "SBMB, 10모 콘솔 토큰? 궁금해요? 전격분석 Q&A",
      channelTitle: "모빅리엘",
    },
    {
      videoId: "vxV2WycspwI",
      title: "(팟캐스트) 뉴비를 위한 사다리 SBMB 🕊️",
      channelTitle: "모빅베어",
    },
    {
      videoId: "l_O8VpTiS68",
      title: "SBMB 가 뭔가요?",
      channelTitle: "모빅스낵한입",
    },
    {
      videoId: "7d3yjlbBai4",
      title: "20250830 뉴비교육 1부 춘심 — 콘솔 & SBMB",
      channelTitle: "대구모빅회관",
    },
    {
      videoId: "cCqpL_4CXko",
      title: "비트모빅 SBMB, 이걸 왜 이제 알았을까? [SBMB 최종편]",
      channelTitle: "오션페이지",
    },
    {
      videoId: "RCWl19Q_U5w",
      title:
        "비트모빅 SBMB, 춘심이팀 과외로 완전 정복! (feat. 2모의 기적) [춘심이 동생과 SBMB 2편]",
      channelTitle: "오션페이지",
    },
    {
      videoId: "dDzwGJ4hUNg",
      title:
        "비트모빅 SBMB, 춘심이팀 과외로 완전 정복! [춘심이 동생과 SBMB 1편]",
      channelTitle: "오션페이지",
    },
  ],
  miracle10: [
    {
      videoId: "LJgGxDmeQTw",
      title: "10모의 기적 신청하기 2부 — [WBMB 스왑 / 종이지갑에 넣기]",
      channelTitle: "비트와모빅 공부하는 고삼이",
    },
    {
      videoId: "xrbPWKyYqwI",
      title:
        "10모의 기적 신청하기 1부 — [신청 및 송금 그리고 종이지갑 수령]",
      channelTitle: "비트와모빅 공부하는 고삼이",
    },
    {
      videoId: "M7v0odlDN2Y",
      title: "10모의 기적 신청하기 — MOVN(모븐)",
      channelTitle: "모빅리엘",
    },
    {
      videoId: "ueZLXa3utyU",
      title: "모븐과 10모의 기적을 소개합니다",
      channelTitle: "BMB NEXUS",
    },
    {
      videoId: "YjLiOYLFiTQ",
      title:
        "🎉 10모의 기적 스타트 기념 🎉 탐색벌 이벤트 방향 전환 그리고 모베까페",
      channelTitle: "모빅베어",
    },
    {
      videoId: "_9pzjZfCxRI",
      title: "BTCMobick — 10모의 기적에 대하여",
      channelTitle: "비트와모빅 공부하는 고삼이",
    },
  ],
  miracle2: [
    {
      videoId: "9cv7f6Ah9wA",
      title: "🔥 2모의 기적 무작정 따라하기 🔥",
      channelTitle: "모빅베어",
    },
    {
      videoId: "F8ZktnjiUxo",
      title: "(업데이트) 2모의 기적 무작정 따라하기 🕊️",
      channelTitle: "모빅베어",
    },
    {
      videoId: "PUT8xA7L8nc",
      title:
        "비트모빅 '2모의 기적 A to Z' — 이벤트 참여 신청부터 엘뱅크 지갑 전송까지 총정리 풀버전",
      channelTitle: "오션페이지",
    },
    {
      videoId: "r_dWwCt_0aI",
      title: "(업데이트) 2모의 기적 설명서 🕊️",
      channelTitle: "모빅베어",
    },
    {
      videoId: "oAvIandRgm8",
      title: "2모의 기적 설명서 🕊️",
      channelTitle: "모빅베어",
    },
    {
      videoId: "LeHasA7Z614",
      title:
        "[2모의 기적] 엘뱅크 가입부터 비트모빅 전송까지! 10만명 대상 초대형 에어드랍 이벤트 준비과정",
      channelTitle: "오션페이지",
    },
    {
      videoId: "19kuzgONpZ0",
      title: "뉴비를 위한 '2모의 기적' 자료모음",
      channelTitle: "BMB NEXUS",
    },
    {
      videoId: "Qm7Wr1BuWRs",
      title: "비트모빅 2모의 기적 이벤트 접수 시작 안내",
      channelTitle: "오태민의 비트모빅 BTCmobick",
    },
    {
      videoId: "mR7jvMMpjEc",
      title: "LBANK 이벤트 — 12월 1일 시작",
      channelTitle: "오태민의 비트모빅 BTCmobick",
    },
    {
      videoId: "uMdE0FVdjKM",
      title: "'2모의 기적' A부터 Z까지",
      channelTitle: "모빅스낵한입",
    },
    {
      videoId: "GIZWiO9CGtE",
      title: "300만원으로 3억?! 오태민 작가가 설계한 마지막 기회",
      channelTitle: "B급감성 모비고",
    },
    {
      videoId: "0OgnASrtSNc",
      title: "LBANK “2모의 기적” 캠페인 안내",
      channelTitle: "Hayden",
    },
    {
      videoId: "Z1s4y4PTTgs",
      title: "2모의 기적",
      channelTitle: "BMB NEXUS",
    },
    {
      videoId: "yia0m1hN2Go",
      title: "2모의 기적 프로젝트 톺아보기",
      channelTitle: "모빅스낵한입",
    },
  ],
};

/** YouTube watch URL · share URL · youtu.be URL 등에서 11자리 videoId 추출. */
export function parseVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1) bare videoId (11자)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      // /shorts/{id}, /live/{id}, /embed/{id}
      const m = u.pathname.match(/^\/(?:shorts|live|embed)\/([a-zA-Z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch {
    // not a URL — fall through
  }
  return null;
}

/** 큐레이션 영상 썸네일 — 추가 외부 호출 없이 videoId만으로 구성. */
export function curatedThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/** 큐레이션 영상 시청 URL. */
export function curatedWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
