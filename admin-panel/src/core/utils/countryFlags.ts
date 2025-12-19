const COUNTRY_FLAGS: Record<string, string> = {
  'IR': '🇮🇷',
  'US': '🇺🇸',
  'CA': '🇨🇦',
  'GB': '🇬🇧',
  'DE': '🇩🇪',
  'FR': '🇫🇷',
  'IT': '🇮🇹',
  'ES': '🇪🇸',
  'NL': '🇳🇱',
  'BE': '🇧🇪',
  'CH': '🇨🇭',
  'AT': '🇦🇹',
  'SE': '🇸🇪',
  'NO': '🇳🇴',
  'DK': '🇩🇰',
  'FI': '🇫🇮',
  'PL': '🇵🇱',
  'CZ': '🇨🇿',
  'GR': '🇬🇷',
  'PT': '🇵🇹',
  'IE': '🇮🇪',
  'AU': '🇦🇺',
  'NZ': '🇳🇿',
  'JP': '🇯🇵',
  'CN': '🇨🇳',
  'KR': '🇰🇷',
  'IN': '🇮🇳',
  'BR': '🇧🇷',
  'MX': '🇲🇽',
  'AR': '🇦🇷',
  'ZA': '🇿🇦',
  'EG': '🇪🇬',
  'AE': '🇦🇪',
  'SA': '🇸🇦',
  'TR': '🇹🇷',
  'RU': '🇷🇺',
  'UA': '🇺🇦',
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'ایران': 'IR',
  'آمریکا': 'US',
  'کانادا': 'CA',
  'انگلستان': 'GB',
  'آلمان': 'DE',
  'فرانسه': 'FR',
  'ایتالیا': 'IT',
  'اسپانیا': 'ES',
  'هلند': 'NL',
  'بلژیک': 'BE',
  'سوئیس': 'CH',
  'اتریش': 'AT',
  'سوئد': 'SE',
  'نروژ': 'NO',
  'دانمارک': 'DK',
  'فنلاند': 'FI',
  'لهستان': 'PL',
  'جمهوری چک': 'CZ',
  'یونان': 'GR',
  'پرتغال': 'PT',
  'ایرلند': 'IE',
  'استرالیا': 'AU',
  'نیوزیلند': 'NZ',
  'ژاپن': 'JP',
  'چین': 'CN',
  'کره جنوبی': 'KR',
  'هند': 'IN',
  'برزیل': 'BR',
  'مکزیک': 'MX',
  'آرژانتین': 'AR',
  'آفریقای جنوبی': 'ZA',
  'مصر': 'EG',
  'امارات': 'AE',
  'عربستان': 'SA',
  'ترکیه': 'TR',
  'روسیه': 'RU',
  'اوکراین': 'UA',
};

export function getCountryFlag(country: string): string {
  if (!country) return '🌍';
  
  if (country.length === 2) {
    return COUNTRY_FLAGS[country.toUpperCase()] || '🌍';
  }
  
  const code = COUNTRY_NAME_TO_CODE[country];
  if (code) {
    return COUNTRY_FLAGS[code] || '🌍';
  }
  
  return '🌍';
}
