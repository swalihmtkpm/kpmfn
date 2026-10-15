export default function GeometricLineBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Subtle Islamic Arabesque & Geometric Wave Contour Lines (Image 1 Inspiration) */}
      <svg
        className="w-full h-full opacity-40 dark:opacity-20 transition-opacity duration-700"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 600"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="geoLineGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary-glow))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="geoLineGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity="0.25" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          <pattern id="islamicGridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            {/* 8-pointed star subtle motif */}
            <path
              d="M30 6 L36 24 L54 30 L36 36 L30 54 L24 36 L6 30 L24 24 Z"
              stroke="currentColor"
              strokeWidth="0.5"
              fill="none"
              className="text-primary/10"
            />
            <circle cx="30" cy="30" r="1.5" className="fill-primary/15" />
          </pattern>
        </defs>

        {/* Subtle repeating Islamic star grid */}
        <rect width="100%" height="100%" fill="url(#islamicGridPattern)" opacity="0.6" />

        {/* Flowing contour lines inspired by Image 1 */}
        <g className="transition-transform duration-1000 ease-out">
          <path
            d="M-100,180 C320,120 480,260 820,200 C1120,150 1320,240 1600,190"
            stroke="url(#geoLineGrad1)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-pulse"
            style={{ animationDuration: '8s' }}
          />
          <path
            d="M-100,220 C280,160 520,300 860,240 C1160,190 1360,280 1600,230"
            stroke="url(#geoLineGrad1)"
            strokeWidth="1.2"
          />
          <path
            d="M-100,260 C240,200 560,340 900,280 C1200,230 1400,320 1600,270"
            stroke="url(#geoLineGrad1)"
            strokeWidth="1"
          />
          <path
            d="M-100,300 C200,240 600,380 940,320 C1240,270 1440,360 1600,310"
            stroke="url(#geoLineGrad2)"
            strokeWidth="1"
            strokeDasharray="6 6"
          />
          <path
            d="M-100,340 C160,280 640,420 980,360 C1280,310 1480,400 1600,350"
            stroke="url(#geoLineGrad2)"
            strokeWidth="0.8"
          />
        </g>

        {/* Delicate radial highlight */}
        <circle cx="85%" cy="40%" r="280" fill="url(#geoLineGrad1)" opacity="0.15" />
      </svg>
    </div>
  );
}
