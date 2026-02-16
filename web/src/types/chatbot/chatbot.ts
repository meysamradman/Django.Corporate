export type PublicChatbotSettings = {
  is_enabled: boolean;
  welcome_message: string;
};

export type PublicChatbotSendMessagePayload = {
  message: string;
};

export type PublicChatbotSendMessageResponse = {
  reply: string;
  source: string;
};

export type PublicChatbotFaqItem = {
  public_id: string;
  question: string;
};
