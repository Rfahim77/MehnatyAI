import logoImage from '@assets/generated_images/AI_career_platform_logo_bdf6966b.png';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 44, className = "" }: LogoProps) {
  return (
    <img 
      src={logoImage}
      alt="Mihnaty AI logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
