import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

const ScrollReveal = ({ 
  children, 
  delay = 0, 
  direction = "up",
  className = ""
}: ScrollRevealProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  const directionStyles = {
    up: "translate-y-12",
    down: "-translate-y-12",
    left: "translate-x-12",
    right: "-translate-x-12",
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${directionStyles[direction]}`
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
