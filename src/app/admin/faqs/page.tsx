"use client";
import React, { useEffect, useState } from "react";
import { faqsService } from "@/services/faqs.service";
import { Sidebar } from "@/components/dashboard/Sidebar/Sidebar";

interface FaqItem {
  question: string;
  answer: string;
}

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<FaqItem>({ question: "", answer: "" });
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  async function fetchFaqs() {
    setLoading(true);
    const data = await faqsService.getFaqs();
    setFaqs(data);
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleEdit(index: number) {
    setEditingIndex(index);
    setForm(faqs[index]);
  }

  function handleCancel() {
    setEditingIndex(null);
    setForm({ question: "", answer: "" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingIndex === null) {
      // Add
      await faqsService.addFaq(form);
    } else {
      // Update
      await faqsService.updateFaq(editingIndex, form);
    }
    setForm({ question: "", answer: "" });
    setEditingIndex(null);
    fetchFaqs();
  }

  async function handleDelete(index: number) {
    await faqsService.deleteFaq(index);
    fetchFaqs();
  }

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <main className="flex-1 pt-6 lg:pt-8 px-4 pb-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">FAQ Management</h1>
            <form onSubmit={handleSubmit} className="mb-6 space-y-2">
              <input
                name="question"
                value={form.question}
                onChange={handleChange}
                placeholder="Question"
                className="w-full border px-2 py-1 rounded"
                required
              />
              <textarea
                name="answer"
                value={form.answer}
                onChange={handleChange}
                placeholder="Answer"
                className="w-full border px-2 py-1 rounded"
                required
              />
              <div className="space-x-2">
                <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 cursor-pointer">
                  {editingIndex === null ? "Add FAQ" : "Update FAQ"}
                </button>
                {editingIndex !== null && (
                  <button type="button" onClick={handleCancel} className="bg-gray-400 text-white px-4 py-1 rounded hover:bg-gray-500 cursor-pointer">
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <ul className="space-y-4">
                {faqs.map((faq, idx) => (
                  <li key={idx} className="border p-4 rounded">
                    <div className="font-semibold">Q: {faq.question}</div>
                    <div className="mb-2">A: {faq.answer}</div>
                    <button
                      onClick={() => handleEdit(idx)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 cursor-pointer"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
