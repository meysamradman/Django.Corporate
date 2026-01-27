import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { MEDIA_MODULES, type MediaContextType, MODULE_MEDIA_CONFIGS } from './constants';

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

/**
 * Detects the current media context based on the URL path.
 * Uses MODULE_MEDIA_CONFIGS for dynamic detection.
 */
function detectContext(pathname: string, params: any): MediaContextValue {
  if (!pathname) return { context: MEDIA_MODULES.MEDIA_LIBRARY };

  for (const [moduleKey, config] of Object.entries(MODULE_MEDIA_CONFIGS)) {
    if (pathname.includes(`/${config.pathSegment}`)) {
      const id = params?.id as string | undefined;
      return {
        context: moduleKey as MediaContextType,
        contextId: id ? (isNaN(Number(id)) ? id : Number(id)) : undefined,
      };
    }
  }

  return { context: MEDIA_MODULES.MEDIA_LIBRARY };
}

export function MediaContextProvider({
  children,
  overrideContext,
  overrideContextId
}: MediaContextProviderProps) {
  const location = useLocation();
  const params = useParams();

  const value = useMemo<MediaContextValue>(() => {
    if (overrideContext) {
      return {
        context: overrideContext,
        contextId: overrideContextId,
      };
    }
    return detectContext(location.pathname, params);
  }, [location.pathname, params, overrideContext, overrideContextId]);

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
  const location = useLocation();
  const params = useParams();

  return useMemo<MediaContextValue>(() => {
    if (overrideContext) {
      return { context: overrideContext, contextId: overrideContextId };
    }
    if (contextValue !== undefined) {
      return contextValue;
    }
    return detectContext(location.pathname, params);
  }, [location.pathname, params, overrideContext, overrideContextId, contextValue]);
}
