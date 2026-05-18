import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  suffix = "",
  className = ""
}: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          const startTime = Date.now();
          const endTime = startTime + duration;

          const updateCount = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const easeOutQuad = 1 - Math.pow(1 - progress, 3);
            
            setCount(Math.floor(easeOutQuad * end));

            if (now < endTime) {
              requestAnimationFrame(updateCount);
            } else {
              setCount(end);
            }
          };

          requestAnimationFrame(updateCount);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [end, duration, hasAnimated]);

  return (
    <div ref={ref} className={className}>
      {count}{suffix}
    </div>
  );
};

export default AnimatedCounter;
