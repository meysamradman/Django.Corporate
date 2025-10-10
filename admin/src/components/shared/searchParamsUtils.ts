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
  
  // Create an empty result object with the same shape as defaultValues
  const result = { ...defaultValues } as T;
  
  // Process each key in the default values
  for (const key in defaultValues) {
    const defaultValue = defaultValues[key];
    const paramValue = getParamValue(key);
    
    if (paramValue === undefined) {
      // Keep default value if param doesn't exist
      continue;
    }
    
    // Handle different data types based on the default value type
    if (typeof defaultValue === 'number') {
      // Convert string to number
      const numericValue = Number(paramValue);
      
      // Handle NaN for numeric values
      if (!isNaN(numericValue)) {
        (result as any)[key] = numericValue;
      }
    } 
    else if (typeof defaultValue === 'boolean') {
      // Convert string to boolean
      if (paramValue === 'true') (result as any)[key] = true;
      else if (paramValue === 'false') (result as any)[key] = false;
    }
    else if (defaultValue === undefined) {
      // Handle cases where default is undefined but a type is expected
      // This is useful for enums or string literals
      (result as any)[key] = paramValue;
    }
    else {
      // For strings and other types, use the param value directly
      (result as any)[key] = paramValue;
    }
  }
  
  // Special handling for pagination to ensure valid values
  if ('page' in result && typeof (result as any).page === 'number') {
    (result as any).page = Math.max(1, (result as any).page);
  }
  
  if ('limit' in result && typeof (result as any).limit === 'number') {
    // Ensure limit is one of the allowed values
    const allowedLimits = [10, 20, 30, 50];
    if (!allowedLimits.includes((result as any).limit)) {
      (result as any).limit = 10; // Default to 10 if not in allowed values
    }
  }
  
  return result;
}

/**
 * Creates a safe cookie header string from cookie store (cookies())
 * @param cookieStore - The cookie store from Next.js cookies() function
 * @returns Cookie header string in format 'name1=value1; name2=value2'
 */
export function createCookieHeader(
  cookieStore: { getAll: () => Array<{ name: string; value: string }> }
): string {
  return cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
} 