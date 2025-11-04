interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 44, className = "" }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      aria-label="Mihnaty AI logo" 
      role="img"
      className={className}
    >
      <rect x="0" y="0" width="40" height="40" rx="9" fill="#0F5132" />
      <text 
        x="50%" 
        y="58%" 
        textAnchor="middle" 
        fill="#fff"
        fontFamily="Noto Kufi Arabic, Tahoma, Arial, sans-serif"
        fontWeight="700" 
        fontSize="22"
      >
        م
      </text>
    </svg>
  );
}
