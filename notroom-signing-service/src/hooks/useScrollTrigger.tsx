import { useState, useEffect } from "react";

export const useScrollTrigger = (threshold: number = 50) => {
  const [isTriggered, setIsTriggered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsTriggered(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isTriggered;
};
