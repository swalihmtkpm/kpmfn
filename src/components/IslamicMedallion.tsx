import { useState } from 'react';

type Props = {
  className?: string;
  size?: number;
};

export default function IslamicMedallion({ className = '', size = 280 }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Emerald Breathing Glow Halo (Image 1 Inspiration) */}
      <div
        className="absolute inset-[-10%] rounded-full pointer-events-none transition-all duration-700"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary-glow) / 0.28) 0%, hsl(var(--primary) / 0.1) 45%, transparent 70%)',
          filter: 'blur(16px)',
        }}
      />

      {/* Outer Arabesque Ring */}
      <div
        className="relative w-full h-full rounded-full p-2 bg-gradient-to-b from-white via-primary/5 to-primary/15 dark:from-card dark:via-card/90 dark:to-primary/20 shadow-xl border border-primary/20 flex items-center justify-center animate-float-subtle overflow-hidden"
        style={{
          boxShadow: '0 20px 45px -10px hsl(var(--primary) / 0.25), 0 0 0 1px hsl(var(--primary) / 0.1)',
        }}
      >
        {/* Subtle decorative inner border */}
        <div className="absolute inset-2 rounded-full border border-dashed border-primary/30 pointer-events-none" />

        {/* Content: High-resolution Calligraphy Art or Library Emblem */}
        {!imgError ? (
          <div className="relative w-[85%] h-[85%] rounded-full bg-white dark:bg-card/90 flex items-center justify-center p-3 shadow-inner overflow-hidden">
            <img
              src="/library-logo.png"
              alt="Makthabathul Imthiyaz Emblem"
              className="w-full h-full object-contain logo-adaptive drop-shadow-sm transition-transform duration-500 hover:scale-105"
              onError={() => setImgError(true)}
              draggable={false}
            />
          </div>
        ) : (
          <div className="relative w-[85%] h-[85%] rounded-full bg-white dark:bg-card/90 flex flex-col items-center justify-center p-4 text-center">
            <svg
              className="w-24 h-24 text-primary"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              <path d="M50 5 L63 26 L87 18 L79 42 L100 55 L77 65 L81 90 L58 79 L42 97 L37 73 L13 77 L23 54 L3 40 L26 31 L20 7 Z" opacity="0.15" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
              <text x="50" y="55" fontSize="16" fontFamily="Amiri, serif" textAnchor="middle" fill="currentColor" fontWeight="bold">
                مكتبة الامتياز
              </text>
            </svg>
          </div>
        )}

        {/* Delicate radial shine accent */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
