import logoImage from '@assets/logo.png';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 44, className = "" }: LogoProps) {
  return (
    <img 
      src={logoImage}
      alt="Mehnaty AI logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
