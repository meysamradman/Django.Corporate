const replaceParams = (message: string, params?: Record<string, string | number>): string => {
  if (!params) return message;
  return Object.entries(params).reduce((msg, [key, value]) => 
    msg.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)), message
  );
};

export const createMessageGetter = <T extends Record<string, string>>(messages: T) => {
  return (key: keyof T, params?: Record<string, string | number>): string => {
    const message = messages[key] || String(key);
    return replaceParams(message, params) as string;
  };
};
