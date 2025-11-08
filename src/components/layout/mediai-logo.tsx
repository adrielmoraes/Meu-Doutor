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
    sm: { icon: 24, text: "text-base" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 48, text: "text-3xl" },
  };

  const currentSize = sizes[size];

  return (
    <div className={cn("flex items-center gap-0 group", className)}>
      <svg
        width={currentSize.icon}
        height={currentSize.icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-300 group-hover:scale-110"
      >
        <defs>
          <linearGradient
            id="logo-gradient-fixed"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#f774c0" />
            <stop offset="50%" stopColor="#e85fb8" />
            <stop offset="100%" stopColor="#d94aaf" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Heart Shape - Main Logo */}
        <g filter="url(#glow)">
          <path
            d="M50 85C50 85 15 65 15 40C15 30 20 20 30 20C37 20 43 25 50 32C57 25 63 20 70 20C80 20 85 30 85 40C85 65 50 85 50 85Z"
            fill="url(#logo-gradient-fixed)"
            className="animate-pulse"
            style={{ animationDuration: "3s" }}
          />
        </g>

        {/* Medical Cross inside Heart */}
        <g filter="url(#glow)" opacity="0.9">
          <rect x="47" y="35" width="6" height="30" rx="1.5" fill="white" />
          <rect x="35" y="47" width="30" height="6" rx="1.5" fill="white" />
        </g>

        {/* AI Brain Nodes - Positioned around heart */}
        <g opacity="0.8">
          {/* Top nodes */}
          <circle
            cx="35"
            cy="28"
            r="2.5"
            fill="#ffffff"
            className="animate-pulse"
            style={{ animationDelay: "0s", animationDuration: "2s" }}
          />
          <circle
            cx="65"
            cy="28"
            r="2.5"
            fill="#ffffff"
            className="animate-pulse"
            style={{ animationDelay: "0.3s", animationDuration: "2s" }}
          />

          {/* Middle nodes */}
          <circle
            cx="25"
            cy="45"
            r="2.5"
            fill="#ffffff"
            className="animate-pulse"
            style={{ animationDelay: "0.6s", animationDuration: "2s" }}
          />
          <circle
            cx="75"
            cy="45"
            r="2.5"
            fill="#ffffff"
            className="animate-pulse"
            style={{ animationDelay: "0.9s", animationDuration: "2s" }}
          />

          {/* Bottom nodes */}
          <circle
            cx="40"
            cy="70"
            r="2.5"
            fill="#ffffff"
            className="animate-pulse"
            style={{ animationDelay: "1.2s", animationDuration: "2s" }}
          />
          <circle
            cx="60"
            cy="70"
            r="2.5"
            fill="#ffffff"
            className="animate-pulse"
            style={{ animationDelay: "1.5s", animationDuration: "2s" }}
          />
        </g>

        {/* Connection lines (Neural Network) */}
        <g opacity="0.25" stroke="white" strokeWidth="1.5">
          <line x1="35" y1="28" x2="47" y2="40" />
          <line x1="65" y1="28" x2="53" y2="40" />
          <line x1="25" y1="45" x2="40" y2="50" />
          <line x1="75" y1="45" x2="60" y2="50" />
          <line x1="40" y1="70" x2="47" y2="60" />
          <line x1="60" y1="70" x2="53" y2="60" />
        </g>
      </svg>

      {showText && (
        <span
          className={cn(
            currentSize.text,
            "font-['Poppins',sans-serif] font-bold tracking-tight transition-all",
          )}
          style={{ color: "#f774c0" }}
        >
          edi<span className="font-extrabold">.AI</span>
        </span>
      )}
    </div>
  );
}
