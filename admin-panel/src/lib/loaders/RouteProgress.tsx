import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingBar, { type LoadingBarRef } from 'react-top-loading-bar';

export function RouteProgress() {
  const location = useLocation();
  const prevPathnameRef = useRef(location.pathname);
  const loaderRef = useRef<LoadingBarRef | null>(null);

  useEffect(() => {
    const pathnameChanged = prevPathnameRef.current !== location.pathname;

    if (pathnameChanged) {
      loaderRef.current?.continuousStart(0, 200);

      const timer = setTimeout(() => {
        loaderRef.current?.complete();
      }, 300);

      prevPathnameRef.current = location.pathname;

      return () => {
        clearTimeout(timer);
        loaderRef.current?.complete();
      };
    }

    prevPathnameRef.current = location.pathname;
  }, [location.pathname]);

  return (
    <LoadingBar
      color="var(--primary)"
      ref={loaderRef}
      height={3}
      shadow={false}
      waitingTime={300}
      transitionTime={200}
      loaderSpeed={200}
    />
  );
}

