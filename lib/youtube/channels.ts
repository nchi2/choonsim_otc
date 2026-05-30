// lib/youtube/channels.ts
export interface YoutubeChannel {
  handle: string;
  displayName: string;
  channelId: string;
  /**
   * YouTube 채널 프로필 이미지 URL (yt3.googleusercontent.com / yt3.ggpht.com).
   * 1회 수집해 정적 상수로 박아둔 값. 런타임에 다시 긁지 않는다.
   * 비어있으면 UI는 이니셜 원형으로 폴백한다.
   */
  avatar?: string;
  tags?: string[];
}

/**
 * 채널 추가/제거 시 이 배열만 수정. handle은 표시용/HTML 폴백용이고,
 * 실제 fetch는 channelId 기반 RSS(`feeds/videos.xml?channel_id=...`)가 1차 경로.
 * channelId·avatar는 핸들 페이지의 `externalId`/`og:image`로 1회 조회해 박는다(RULE: 임의 추측 금지).
 */
export const YOUTUBE_CHANNELS: YoutubeChannel[] = [
  {
    handle: "@otaverse",
    displayName: "오태민의 비트모빅 BTCmobick",
    channelId: "UCjAmcKweNBx-Ju2xOPBOkkQ",
    avatar:
      "https://yt3.googleusercontent.com/-DDzC6rjIJ81eO_M7-h-WC3CLTxrujLF7GATIFIGIXDpQy3d7v7TcCuPwJC3iZzsUInDP7ImQQ=s900-c-k-c0x00ffffff-no-rj",
    tags: ["otc", "project"],
  },
  {
    handle: "@wisdom_of_bitcoin",
    displayName: "오태민의 지혜의족보",
    channelId: "UCzGUaygjUeV-Zm_DRuFS0pA",
    avatar:
      "https://yt3.googleusercontent.com/3NSkcLtDTb6hHefm67n32edxSxnpjEEMczSXSVBE3tAcJqnGPUQWsLRrXj064ZFeeojg2giLlf8=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@오태민-r1j",
    displayName: "오태민",
    channelId: "UCgoUECWeZE7i0WQ0_xHWVMg",
    avatar:
      "https://yt3.googleusercontent.com/ytc/AIdro_k8O6eBNbAaE6rAENo3ZqKfJn1KL940IG66PPuEVv86-hU=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@oceanpage",
    displayName: "오션페이지",
    channelId: "UCY4iRMfL6NyekvBS47VYYtA",
    avatar:
      "https://yt3.googleusercontent.com/DUF9q4OEVGbdz-Ei9xR-8et5_BBRgIA5wbPAseJuVOFxpZ8f7fptTWNuPF97P4WKCseejmz2NTs=s900-c-k-c0x00ffffff-no-rj",
    tags: ["defi", "insight", "kr"],
  },
  {
    handle: "@vivikim2029",
    displayName: "Vivi Kim",
    channelId: "UC-qJDtz16KSxTTnTrIMk3Dg",
    avatar:
      "https://yt3.googleusercontent.com/-_4xpJxERh82sx8MKYV0smst4qTRHV0h6KfKCfxwe9708f6qm40V9IK_yMqVzJQ2jA215yGlL2g=s900-c-k-c0x00ffffff-no-rj",
    tags: ["market", "global"],
  },

  {
    handle: "@MobickerGabriel",
    displayName: "Mobicker Gabriel",
    channelId: "UCuslGcmrP0wXKLFJpvkN8Mg",
    avatar:
      "https://yt3.googleusercontent.com/OnAy1zYwJAQi_u70fXbUIiGBjvg52lGhi6cvLpaDNObK5YzWnARIphpOwnlSknzhoTLJwIqc=s900-c-k-c0x00ffffff-no-rj",
    tags: ["education", "global"],
  },
  {
    handle: "@hoguhogu11",
    displayName: "호구호구",
    channelId: "UC8P7tiKm39c66cSU0mqy32Q",
    avatar:
      "https://yt3.googleusercontent.com/YYPwK3dv7FWn1WRfT985PdFZ7F1WvK_6h4L1Tye6QXuZJdip1m8vF1rg6zROlDrbxUQzYK1Lig=s900-c-k-c0x00ffffff-no-rj",
    tags: ["community", "kr"],
  },
  {
    handle: "@BitcoinBear",
    displayName: "모빅베어",
    channelId: "UC8ta8yQ1af2zTjJU2FxBMpw",
    avatar:
      "https://yt3.googleusercontent.com/YKBKbxoZgUjxsbHsoCoHntfudwflyyP65sPeTdo0UdU4FhvnHipfC239PCj1rZrAAU-lTxg12hA=s900-c-k-c0x00ffffff-no-rj",
  },

  {
    handle: "@MobickClipSnack",
    displayName: "Mobick Clip Snack",
    channelId: "UCAh6H2aP9ACLF24_QWD27cw",
    avatar:
      "https://yt3.googleusercontent.com/wTrXguicZsrs4o_LzWdkr7IQ1x48Dn0TejxOaJLyE8MgKOnBzN_G7aPPd2BjdRFF8w86jWEEzw=s900-c-k-c0x00ffffff-no-rj",
    tags: ["shorts", "highlight"],
  },
  {
    handle: "@OTM4Fan",
    displayName: "오태민사생팬",
    channelId: "UCb6iE4EfyLImr4e3dZg-5kA",
    avatar:
      "https://yt3.googleusercontent.com/y-K-9ZwvGsBkK-9U-7AHPBTe0vvHsvgH3juLYeO1oHrl4kdhLbNGaQZqJpABvX0Q34yVjO3VyA=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@choonsim_bmb",
    displayName: "춘심_BTCMobick",
    channelId: "UCVhE7maNcJuSJwtZi99tGNw",
    avatar:
      "https://yt3.googleusercontent.com/fmaloJ0iIFMrA-0RWW1ykcpp8Djj7bhtMTCZIhdquloVgnVPW-xMymHP6ThYwhR4KlhNi4h1dfE=s900-c-k-c0x00ffffff-no-rj",
  },

  {
    handle: "@btcmobickerjay",
    displayName: "비트+모빅커 정계석",
    channelId: "UC2ChW78EQKfznYnmHWKlWkQ",
    avatar:
      "https://yt3.googleusercontent.com/yd_ID3L6TgtX2F30-C_Bydzz_PNYMo33tia-RNSh36RFP0ZYvIqPSWUUScgMw-QzcyMYrftO7tk=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@Bitcoin19",
    displayName: "비트코이너 김상환",
    channelId: "UCp7CKHSRCBJmLTHAA4gYrCQ",
    avatar:
      "https://yt3.googleusercontent.com/5BFg6n6y8qoRT7wSLq-SJOPB0HYX-WHhMAJnWAaas76hLpO6LltDA9r1EYgSrCbXxjpyDseOQw=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@4Mobickers",
    displayName: "BTCMobickers 4MO",
    channelId: "UC63sTKN8unvESTejWujG_tw",
    avatar:
      "https://yt3.googleusercontent.com/35Td_vELc_2auSNrs4S3KzW_UWoJlPVcqpRN6iarANJJPuahqdFEZbrLIXWnVmAI5aEzyiqyCwg=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@OBB_TV",
    displayName: "OBB",
    channelId: "UCk9FLUg_EfUmBqlYwnMQMKQ",
    avatar:
      "https://yt3.googleusercontent.com/2VfZ8FO9Umop7pbvIl9Pmw1Hpemq3czJXPri24ixkeOtSUs77_ZWVdnk2i8OvshLrQGe2nyU=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@Basac.",
    displayName: "바삭",
    channelId: "UCj48NHBaH1jX2uc8S6swgvA",
    avatar:
      "https://yt3.googleusercontent.com/6QPOJa-eMvRqHZ8zDFv68BzBptZlV1RQ-lGTW83Y-6ImhPTbAUGu6yVAW5-F_3rm-y8Dw7vCOQ=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@futureman77777",
    displayName: "FutureMan",
    channelId: "UC89C4CVYn1W8wzXp5Zvb68w",
    avatar:
      "https://yt3.googleusercontent.com/8-Hhz1VT-bsX-ZFmDVMiILEX4puTK_Zh7Jk81oJ0NMNDChIPwbdqZXbmqCHoefoAmkFrafq1BxQ=s900-c-k-c0x00ffffff-no-rj",
    tags: ["macro", "market", "kr"],
  },

  // TODO(@Mobick_everywhere): 핸들이 youtube.com에서 404로 잡힘. 정확한 handle 또는
  // channelId가 확인되면 이 위치에 항목을 추가할 것. (임의 추측 금지)
  {
    handle: "@rea_btcmobick",
    displayName: "REA",
    channelId: "UC7epgmQ3B1x5TfcnA5fy0bg",
    avatar:
      "https://yt3.googleusercontent.com/4TisZkm9BtsRAgi27b503ZCAz725vwSfAeJiGFxbH1nKNt0jtR8D2mQ8L17MCFjP4x8I4l470A=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@B급감성_모비고",
    displayName: "B급감성 모비고",
    channelId: "UCpBH28LPwPucFEAFMUQxo2w",
    avatar:
      "https://yt3.googleusercontent.com/zzDb1nWpJl0LC7CwBBNxRIg0-toJj3JxQfwCaK_Uq-mQb7xbMlguTmxwsHE3Mo5rX74RFdYYKw=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@mordinary-days",
    displayName: "모디너리 Mordinary",
    channelId: "UCI_N-jfyNoHibP9Tns2mIAw",
    avatar:
      "https://yt3.googleusercontent.com/CYASN__Qyecv_mUzjc4NliA20QJ4AU0ENn_Zrod9b3aY0n5d10yURIemVHknMtxufulwaLgC=s900-c-k-c0x00ffffff-no-rj",
  },
  {
    handle: "@mobickergo3e",
    displayName: "비트와모빅 공부하는 고삼이",
    channelId: "UCx1QvWfAnbT3zDygU8BPd3Q",
    avatar:
      "https://yt3.googleusercontent.com/XVZfKDvv6CbY88ydkFXUqDdh0BBwrGKXzewEMvXOzx8ZiIHWoNCSsw_nsUFCMorTO5ZyL2BT=s900-c-k-c0x00ffffff-no-rj",
  },
];

/** 채널 클릭 시 새 탭으로 열 URL — channelId 기반이 가장 안정적. */
export function youtubeChannelUrl(channel: YoutubeChannel): string {
  return `https://www.youtube.com/channel/${channel.channelId}`;
}
