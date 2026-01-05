import { Chrome, Edge, Firefox, Safari, Globe } from "lucide-react";

/**
 * Browser name to icon mapping
 */
export function getBrowserIcon(browser: string) {
  const browserLower = browser?.toLowerCase() || '';
  
  if (browserLower.includes('chrome')) {
    return <Chrome className="h-4 w-4 text-blue-1" />;
  }
  if (browserLower.includes('edge') || browserLower.includes('edg')) {
    return <Edge className="h-4 w-4 text-blue-1" />;
  }
  if (browserLower.includes('firefox')) {
    return <Firefox className="h-4 w-4 text-orange-1" />;
  }
  if (browserLower.includes('safari')) {
    return <Safari className="h-4 w-4 text-blue-1" />;
  }
  
  return <Globe className="h-4 w-4 text-font-s" />;
}

/**
 * Browser name to display name (Persian)
 */
export function getBrowserName(browser: string): string {
  const browserLower = browser?.toLowerCase() || '';
  
  if (browserLower.includes('chrome')) {
    return 'Chrome';
  }
  if (browserLower.includes('edge') || browserLower.includes('edg')) {
    return 'Edge';
  }
  if (browserLower.includes('firefox')) {
    return 'Firefox';
  }
  if (browserLower.includes('safari')) {
    return 'Safari';
  }
  if (browserLower.includes('opera')) {
    return 'Opera';
  }
  
  return browser || 'سایر';
}

