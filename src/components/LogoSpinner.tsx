type Props = { size?: number; className?: string };

/**
 * Library logo rotating continuously anticlockwise. Used as the universal loading indicator.
 */
export default function LogoSpinner({ size = 56, className = '' }: Props) {
  return (
    <img
      src="/library-logo.png"
      alt="loading"
      width={size}
      height={size}
      className={`animate-spin-cw logo-adaptive select-none ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

export function FullPageLoader({ size = 96 }: { size?: number }) {
  return (
    <div className="min-h-[40vh] w-full flex items-center justify-center py-12">
      <LogoSpinner size={size} />
    </div>
  );
}
