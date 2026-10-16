import { BrandSpinner, FullPageLoader as EnhancedFullPageLoader } from './LoadingIndicator';

type Props = { size?: number; className?: string };

/**
 * Universal Brand Loading Spinner with Islamic-minimalist concentric rings
 */
export default function LogoSpinner({ size = 56, className = '' }: Props) {
  return <BrandSpinner size={size} className={className} />;
}

export function FullPageLoader({ size = 64, text }: { size?: number; text?: string }) {
  return <EnhancedFullPageLoader size={size} text={text} />;
}

