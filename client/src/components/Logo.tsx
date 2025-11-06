interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 44, className = "" }: LogoProps) {
  const viewBox = 64;
  const scale = size / 44;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      aria-label="Mehnaty AI logo" 
      role="img"
      className={className}
    >
      <rect x="0" y="0" width="64" height="64" rx="12" fill="#0F5132"/>
      <g fill="none" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 20h16a4 4 0 0 1 4 4v2H20v-2a4 4 0 0 1 4-4z"/>
        <rect x="12" y="26" width="40" height="26" rx="4"/>
        <path d="M22 40v-6m10 16V34m10 6v-6"/>
        <circle cx="22" cy="34" r="2.8" fill="#2CC295" stroke="none"/>
        <circle cx="32" cy="30" r="2.8" fill="#2CC295" stroke="none"/>
        <circle cx="42" cy="34" r="2.8" fill="#2CC295" stroke="none"/>
        <path d="M22 34h10M42 34H32" />
      </g>
    </svg>
  );
}
