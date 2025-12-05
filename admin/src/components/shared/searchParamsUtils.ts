export async function processSearchParams<T extends Record<string, any>>(
  searchParams: Record<string, string | string[] | undefined> | any,
  defaultValues: T
): Promise<T> {

  const resolvedParams = searchParams instanceof Promise 
    ? await searchParams 
    : searchParams;

  const getParamValue = (key: string) => {
    if (!resolvedParams) return undefined;

    if (typeof resolvedParams.get === 'function') {
      return resolvedParams.get(key);
    }

    if (typeof resolvedParams === 'object') {
      return resolvedParams[key];
    }
    
    return undefined;
  };
  
  const result = { ...defaultValues } as T;
  
  for (const key in defaultValues) {
    const defaultValue = defaultValues[key];
    const paramValue = getParamValue(key);
    
    if (paramValue === undefined) {
      continue;
    }
    
    if (typeof defaultValue === 'number') {
      const numericValue = Number(paramValue);
      
      if (!isNaN(numericValue)) {
        (result as any)[key] = numericValue;
      }
    } 
    else if (typeof defaultValue === 'boolean') {
      if (paramValue === 'true') (result as any)[key] = true;
      else if (paramValue === 'false') (result as any)[key] = false;
    }
    else if (defaultValue === undefined) {
      (result as any)[key] = paramValue;
    }
    else {
      (result as any)[key] = paramValue;
    }
  }
  
  if ('page' in result && typeof (result as any).page === 'number') {
    (result as any).page = Math.max(1, (result as any).page);
  }
  
  if ('limit' in result && typeof (result as any).limit === 'number') {
    const allowedLimits = [10, 20, 30, 50];
    if (!allowedLimits.includes((result as any).limit)) {
      (result as any).limit = 10;
    }
  }
  
  return result;
}

export function createCookieHeader(
  cookieStore: { getAll: () => Array<{ name: string; value: string }> }
): string {
  return cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
} 