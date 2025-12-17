import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';

export function TopLoader() {
  const location = useLocation();

  useEffect(() => {
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

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location.pathname]);

  return null;
}

