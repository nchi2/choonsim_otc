/** 카카오톡 오픈채팅 등 안내용 — 브랜드 공식 에셋이 아닌 노란 말풍선 스타일 */

interface KakaoTalkIconProps {
  size?: number;
  className?: string;
}

export function KakaoTalkIcon({ size = 20, className }: KakaoTalkIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fill="#FEE500"
        d="M12 4C7.03 4 3 7.36 3 11.5c0 2.46 1.48 4.6 3.75 5.78L5.8 20.2 9.3 18.3c.83.22 1.7.34 2.61.34 4.97 0 9-3.36 9-7.5S16.97 4 12 4z"
      />
      <circle cx="9" cy="11" r="1.25" fill="#381E1F" />
      <circle cx="15" cy="11" r="1.25" fill="#381E1F" />
    </svg>
  );
}
