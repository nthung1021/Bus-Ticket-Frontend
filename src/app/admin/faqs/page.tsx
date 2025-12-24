"use client";
import React, { useEffect, useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const API_URL = process.env.NEXT_PUBLIC_FAQ_API_URL || "http://localhost:3000/faqs";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<FaqItem>({ question: "", answer: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  async function fetchFaqs() {
    setLoading(true);
    const res = await fetch(API_URL);
    const data = await res.json();
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
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      // Update
      await fetch(`${API_URL}/${editingIndex}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ question: "", answer: "" });
    setEditingIndex(null);
    fetchFaqs();
  }

  async function handleDelete(index: number) {
    await fetch(`${API_URL}/${index}`, { method: "DELETE" });
    fetchFaqs();
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">FAQ Management</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          name="question"
          value={form.question}
          onChange={handleChange}
          placeholder="Question"
          className="w-full border px-2 py-1"
          required
        />
        <textarea
          name="answer"
          value={form.answer}
          onChange={handleChange}
          placeholder="Answer"
          className="w-full border px-2 py-1"
          required
        />
        <div className="space-x-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
            {editingIndex === null ? "Add FAQ" : "Update FAQ"}
          </button>
          {editingIndex !== null && (
            <button type="button" onClick={handleCancel} className="bg-gray-400 text-white px-4 py-1 rounded">
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
                className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(idx)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
