import api from "@/lib/api";

export interface Message {
  role: "system" | "human" | "ai";
  content: string;
  timestamp?: string;
}

export interface SendMessageDto {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  conversationId: string;
  ai: Message;
  history: Message[];
}

export const chatService = {
  sendMessage: async (data: SendMessageDto): Promise<ChatResponse> => {
    const response = await api.post("/chat/message", data);
    return response.data;
  },

  getHistory: async (id: string): Promise<Message[]> => {
    const response = await api.get(`/chat/history/${id}`);
    return response.data;
  },

  deleteHistory: async (
    id: string,
  ): Promise<{ deleted: boolean; conversationId: string }> => {
    const response = await api.delete(`/chat/history/${id}`);
    return response.data;
  },
};
