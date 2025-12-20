import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLocation, useParams } from 'react-router-dom';

type MediaContextType = 'media_library' | 'portfolio' | 'blog';

interface MediaContextValue {
  context: MediaContextType;
  contextId?: number | string;
}

const MediaContext = createContext<MediaContextValue | undefined>(undefined);

interface MediaContextProviderProps {
  children: ReactNode;
  overrideContext?: MediaContextType;
  overrideContextId?: number | string;
}

export function MediaContextProvider({ 
  children, 
  overrideContext, 
  overrideContextId 
}: MediaContextProviderProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const params = useParams();

  const value = useMemo<MediaContextValue>(() => {
    if (overrideContext) {
      return {
        context: overrideContext,
        contextId: overrideContextId,
      };
    }

    if (!pathname) {
      return { context: 'media_library' };
    }

    if (pathname.includes('/portfolios')) {
      const id = params?.id as string | undefined;
      return {
        context: 'portfolio',
        contextId: id ? (isNaN(Number(id)) ? id : Number(id)) : undefined,
      };
    }

    if (pathname.includes('/blogs')) {
      const id = params?.id as string | undefined;
      return {
        context: 'blog',
        contextId: id ? (isNaN(Number(id)) ? id : Number(id)) : undefined,
      };
    }

    return { context: 'media_library' };
  }, [pathname, params, overrideContext, overrideContextId]);

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMediaContext(
  overrideContext?: MediaContextType,
  overrideContextId?: number | string
): MediaContextValue {
  const contextValue = useContext(MediaContext);
  
  if (contextValue !== undefined) {
    if (overrideContext) {
      return {
        context: overrideContext,
        contextId: overrideContextId,
      };
    }
    return contextValue;
  }

  const location = useLocation();
  const pathname = location.pathname;
  const params = useParams();

  return useMemo<MediaContextValue>(() => {
    if (overrideContext) {
      return {
        context: overrideContext,
        contextId: overrideContextId,
      };
    }

    if (!pathname) {
      return { context: 'media_library' };
    }

    if (pathname.includes('/portfolios')) {
      const id = params?.id as string | undefined;
      return {
        context: 'portfolio',
        contextId: id ? (isNaN(Number(id)) ? id : Number(id)) : undefined,
      };
    }

    if (pathname.includes('/blogs')) {
      const id = params?.id as string | undefined;
      return {
        context: 'blog',
        contextId: id ? (isNaN(Number(id)) ? id : Number(id)) : undefined,
      };
    }

    return { context: 'media_library' };
  }, [pathname, params, overrideContext, overrideContextId]);
}
