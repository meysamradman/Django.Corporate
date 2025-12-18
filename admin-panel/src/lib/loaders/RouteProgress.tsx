import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';

export function RouteProgress() {
  const location = useLocation();
  const prevPathnameRef = React.useRef(location.pathname);

  useEffect(() => {
    const pathnameChanged = prevPathnameRef.current !== location.pathname;
    
    if (pathnameChanged) {
      NProgress.configure({
        showSpinner: false,
        easing: 'ease',
        speed: 200,
        minimum: 0.08,
      });

      NProgress.start();

      const timer = setTimeout(() => {
        NProgress.done();
      }, 300);

      prevPathnameRef.current = location.pathname;

      return () => {
        clearTimeout(timer);
        NProgress.done();
      };
    }
    
    prevPathnameRef.current = location.pathname;
  }, [location.pathname]);

  return null;
}

