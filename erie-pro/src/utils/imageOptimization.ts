
// Image optimization utilities
export interface ImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  quality?: number;
}

export const getOptimizedImageUrl = (src: string, width?: number, quality = 75): string => {
  // If it's already an optimized URL or external URL, return as-is
  if (src.startsWith('http') || src.includes('?')) {
    return src;
  }

  // For local images, add optimization parameters
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  params.append('q', quality.toString());
  
  return `${src}${params.toString() ? `?${params.toString()}` : ''}`;
};

export const generateSrcSet = (src: string, widths: number[] = [320, 640, 1024, 1280]): string => {
  return widths
    .map(width => `${getOptimizedImageUrl(src, width)} ${width}w`)
    .join(', ');
};

export const getImageSizes = (breakpoints: string[] = ['(max-width: 768px) 100vw', '50vw']): string => {
  return breakpoints.join(', ');
};

// Optimized Image component props
export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  responsive?: boolean;
  priority?: boolean;
}
