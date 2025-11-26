"use client";

import { cn } from "@/lib/utils";

interface MediAILogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function MediAILogo({
  className,
  showText = true,
  size = "md",
}: MediAILogoProps) {
  const sizes = {
    sm: { icon: 22, text: "text-base", gap: "gap-1" },
    md: { icon: 28, text: "text-xl", gap: "gap-1.5" },
    lg: { icon: 42, text: "text-3xl", gap: "gap-2" },
  };

  const currentSize = sizes[size];

  return (
    <div className={cn("flex items-center group", currentSize.gap, className)}>
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-300 group-hover:scale-105 flex-shrink-0"
        style={{ minWidth: currentSize.icon, minHeight: currentSize.icon }}
      >
        <defs>
          <linearGradient
            id="logo-heart-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ff6eb4" />
            <stop offset="50%" stopColor="#f754b3" />
            <stop offset="100%" stopColor="#e83fa5" />
          </linearGradient>
          <filter id="heart-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#e83fa5" floodOpacity="0.4" />
          </filter>
        </defs>

        <g filter="url(#soft-shadow)">
          <path
            d="M50 82C50 82 12 58 12 35C12 22 22 14 34 14C42 14 48 20 50 25C52 20 58 14 66 14C78 14 88 22 88 35C88 58 50 82 50 82Z"
            fill="url(#logo-heart-gradient)"
            className="transition-all duration-500"
          />
        </g>

        <g opacity="0.95">
          <rect x="46" y="32" width="8" height="28" rx="2" fill="white" />
          <rect x="36" y="42" width="28" height="8" rx="2" fill="white" />
        </g>

        <g opacity="0.7">
          <circle cx="30" cy="24" r="3" fill="white" className="animate-pulse" style={{ animationDuration: "2.5s" }} />
          <circle cx="70" cy="24" r="3" fill="white" className="animate-pulse" style={{ animationDelay: "0.4s", animationDuration: "2.5s" }} />
          <circle cx="18" cy="42" r="2.5" fill="white" className="animate-pulse" style={{ animationDelay: "0.8s", animationDuration: "2.5s" }} />
          <circle cx="82" cy="42" r="2.5" fill="white" className="animate-pulse" style={{ animationDelay: "1.2s", animationDuration: "2.5s" }} />
        </g>

        <g opacity="0.2" stroke="white" strokeWidth="1.2">
          <line x1="30" y1="24" x2="44" y2="38" />
          <line x1="70" y1="24" x2="56" y2="38" />
          <line x1="18" y1="42" x2="36" y2="46" />
          <line x1="82" y1="42" x2="64" y2="46" />
        </g>
      </svg>

      {showText && (
        <span
          className={cn(
            currentSize.text,
            "font-semibold tracking-tight transition-all leading-none",
          )}
          style={{ 
            fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
            letterSpacing: "-0.02em"
          }}
        >
          <span style={{ 
            background: "linear-gradient(135deg, #ff6eb4 0%, #f754b3 50%, #e83fa5 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            edi
          </span>
          <span style={{ 
            background: "linear-gradient(135deg, #e83fa5 0%, #d42d99 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontWeight: 700,
          }}>
            .AI
          </span>
        </span>
      )}
    </div>
  );
}
