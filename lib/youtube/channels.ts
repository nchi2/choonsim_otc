// lib/youtube/channels.ts
export interface YoutubeChannel {
  handle: string;
  displayName: string;
  channelId: string;
  tags?: string[];
}

export const YOUTUBE_CHANNELS: YoutubeChannel[] = [
  {
    handle: "@futureman77777",
    displayName: "FutureMan",
    channelId: "UC89C4CVYn1W8wzXp5Zvb68w", // TODO: 실제 channelId로 교체
    tags: ["macro", "market", "kr"],
  },
  {
    handle: "@oceanpage",
    displayName: "오션페이지",
    channelId: "UCY4iRMfL6NyekvBS47VYYtA",
    tags: ["defi", "insight", "kr"],
  },
  {
    handle: "@MobickClipSnack",
    displayName: "Mobick Clip Snack",
    channelId: "UCAh6H2aP9ACLF24_QWD27cw",
    tags: ["shorts", "highlight"],
  },
  {
    handle: "@MobickerGabriel",
    displayName: "Mobicker Gabriel",
    channelId: "UCuslGcmrP0wXKLFJpvkN8Mg",
    tags: ["education", "global"],
  },
  {
    handle: "@hoguhogu11",
    displayName: "호구호구",
    channelId: "UC8P7tiKm39c66cSU0mqy32Q",
    tags: ["community", "kr"],
  },
  {
    handle: "@vivikim2029",
    displayName: "Vivi Kim",
    channelId: "UC-qJDtz16KSxTTnTrIMk3Dg",
    tags: ["market", "global"],
  },
  {
    handle: "@otaverse",
    displayName: "Otaverse",
    channelId: "UCjAmcKweNBx-Ju2xOPBOkkQ",
    tags: ["otc", "project"],
  },
];
