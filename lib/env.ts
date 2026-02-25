// lib/env.ts
type Env = {
  youtubeApiKey: string | null;
};

const getEnvValue = (value: string | undefined): string | null =>
  value && value.trim().length > 0 ? value.trim() : null;

export const env: Env = {
  youtubeApiKey: getEnvValue(process.env.YOUTUBE_API_KEY),
};


