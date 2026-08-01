import { useRef } from "react";

export const useDebounce = (fn: () => void, delay: number) => {
  const timeoutRef = useRef<number | null>(null);

  const debounceFunction = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      fn();
    }, delay);
  };

  return debounceFunction;
};
