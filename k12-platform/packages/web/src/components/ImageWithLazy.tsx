import { useState, useRef, useEffect, CSSProperties } from 'react';

interface ImageWithLazyProps {
  src: string;
  alt: string;
  style?: CSSProperties;
}

export function ImageWithLazy({ src, alt, style }: ImageWithLazyProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={imgRef}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-secondary, #f0f0f0)',
        ...style,
      }}
    >
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-tertiary, #999)',
            fontSize: 'var(--font-size-sm, 14px)',
          }}
        >
          加载中...
        </div>
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}
    </div>
  );
}