import api from "@/lib/api";

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqsService = {
  getFaqs: async (): Promise<FaqItem[]> => {
    const response = await api.get("/faqs");
    return response.data;
  },

  addFaq: async (faq: FaqItem): Promise<FaqItem[]> => {
    const response = await api.post("/faqs", faq);
    return response.data;
  },

  updateFaq: async (index: number, faq: FaqItem): Promise<FaqItem[]> => {
    const response = await api.put(`/faqs/${index}`, faq);
    return response.data;
  },

  deleteFaq: async (index: number): Promise<FaqItem[]> => {
    const response = await api.delete(`/faqs/${index}`);
    return response.data;
  },
};
