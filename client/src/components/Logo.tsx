import logoImage from '@assets/mehnaty-logo.png';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 44, className = "" }: LogoProps) {
  return (
    <img 
      src={logoImage}
      alt="Mehnaty AI | مهنتي - Your AI Career Assistant"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
