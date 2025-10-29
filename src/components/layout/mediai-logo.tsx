'use client';

import { cn } from "@/lib/utils";

interface MediAILogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function MediAILogo({ className, showText = true, size = 'md' }: MediAILogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-base' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' }
  };

  const currentSize = sizes[size];

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <svg 
        width={currentSize.icon} 
        height={currentSize.icon} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-300 group-hover:scale-110"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer Circle - Health Shield */}
        <circle 
          cx="50" 
          cy="50" 
          r="45" 
          stroke="url(#logo-gradient)" 
          strokeWidth="3" 
          fill="none"
          className="animate-pulse"
          style={{ animationDuration: '3s' }}
        />
        
        {/* Medical Cross */}
        <g filter="url(#glow)">
          <rect 
            x="45" 
            y="25" 
            width="10" 
            height="50" 
            rx="2"
            fill="url(#logo-gradient)"
          />
          <rect 
            x="25" 
            y="45" 
            width="50" 
            height="10" 
            rx="2"
            fill="url(#logo-gradient)"
          />
        </g>
        
        {/* AI Brain Nodes */}
        <g opacity="0.8">
          {/* Top nodes */}
          <circle cx="35" cy="30" r="3" fill="#22D3EE" className="animate-pulse" style={{ animationDelay: '0s', animationDuration: '2s' }} />
          <circle cx="65" cy="30" r="3" fill="#3B82F6" className="animate-pulse" style={{ animationDelay: '0.3s', animationDuration: '2s' }} />
          
          {/* Middle nodes */}
          <circle cx="30" cy="50" r="3" fill="#6366F1" className="animate-pulse" style={{ animationDelay: '0.6s', animationDuration: '2s' }} />
          <circle cx="70" cy="50" r="3" fill="#22D3EE" className="animate-pulse" style={{ animationDelay: '0.9s', animationDuration: '2s' }} />
          
          {/* Bottom nodes */}
          <circle cx="35" cy="70" r="3" fill="#3B82F6" className="animate-pulse" style={{ animationDelay: '1.2s', animationDuration: '2s' }} />
          <circle cx="65" cy="70" r="3" fill="#6366F1" className="animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '2s' }} />
        </g>
        
        {/* Connection lines (Neural Network) */}
        <g opacity="0.3" stroke="url(#logo-gradient)" strokeWidth="1">
          <line x1="35" y1="30" x2="50" y2="40" />
          <line x1="65" y1="30" x2="50" y2="40" />
          <line x1="30" y1="50" x2="50" y2="50" />
          <line x1="70" y1="50" x2="50" y2="50" />
          <line x1="35" y1="70" x2="50" y2="60" />
          <line x1="65" y1="70" x2="50" y2="60" />
        </g>
      </svg>
      
      {showText && (
        <span className={cn(
          currentSize.text,
          "font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:via-blue-300 group-hover:to-indigo-300 transition-all"
        )}>
          Medi<span className="font-extrabold">AI</span>
        </span>
      )}
    </div>
  );
}
