'use client';

import { useEffect, useState } from 'react';

export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Set hydrated immediately when component mounts in browser
    setIsHydrated(true);
  }, []);

  return isHydrated;
} 