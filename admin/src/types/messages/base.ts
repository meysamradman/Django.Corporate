export type MessageKey = string;
export type MessageParams = Record<string, string | number>;
export type MessageGetter<T extends Record<string, string>> = (key: keyof T, params?: MessageParams) => string;

export interface MessageModule<T extends Record<string, string>> {
  messages: T;
  get: MessageGetter<T>;
}
