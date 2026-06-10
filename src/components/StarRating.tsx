import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
};

export default function StarRating({ value, onChange, size = 20, readOnly = false }: Props) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(n)}
            className={cn('transition-transform', !readOnly && 'hover:scale-110 cursor-pointer', readOnly && 'cursor-default')}
            aria-label={`${n} stars`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(filled ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground')}
            />
          </button>
        );
      })}
    </div>
  );
}
