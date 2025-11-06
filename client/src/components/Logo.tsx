import logoUrl from "@assets/Minimalist Logo with Angular Patterns (Logo)_1762433252661.png";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 44, className = "", showText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoUrl}
        alt="Mehnaty AI logo"
        width={size}
        height={size}
        className="rounded-lg"
      />
    </div>
  );
}
