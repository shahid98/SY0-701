import { useEffect, useState } from 'react';
import { useProgress } from '@/store/progress';

/** True when animations should be minimised (app setting overrides the OS preference). */
export function usePrefersReducedMotion(): boolean {
  const motion = useProgress((s) => s.settings.motion);
  const [os, setOs] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = () => setOs(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  if (motion === 'reduce') return true;
  if (motion === 'full') return false;
  return os;
}
