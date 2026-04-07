/** 링크트리 서비스를 가리키는 링 모양 마크(브랜드 SVG 미사용, 점 배열로 유사 레이아웃) */

interface LinktreeIconProps {
  size?: number;
  className?: string;
}

export function LinktreeIcon({ size = 20, className }: LinktreeIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="4" r="2.2" />
      <circle cx="6" cy="11" r="2.2" />
      <circle cx="18" cy="11" r="2.2" />
      <circle cx="6" cy="18" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
    </svg>
  );
}
