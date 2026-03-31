
import { forwardRef } from 'react';
import { OptimizedImageProps, getOptimizedImageUrl, generateSrcSet, getImageSizes } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ 
    src, 
    alt, 
    width, 
    height, 
    quality = 75, 
    responsive = true, 
    priority = false,
    className,
    loading,
    ...props 
  }, ref) => {
    const optimizedSrc = getOptimizedImageUrl(src, width, quality);
    
    return (
      <img
        ref={ref}
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading || 'lazy'}
        srcSet={responsive ? generateSrcSet(src) : undefined}
        sizes={responsive ? getImageSizes() : undefined}
        className={cn('transition-opacity duration-300', className)}
        {...props}
      />
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export { OptimizedImage };
