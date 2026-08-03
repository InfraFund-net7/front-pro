'use client';
import { FormInput } from '@/components/ui/form-input';
import { Plus, Trash } from 'lucide-react';
import React, { useState } from 'react';

interface Question {
  id: string;
  question: string;
  answer: string;
}

function FAQForm() {
  const [faqs, setFaqs] = useState<Question[]>([
    {
      id: '1',
      question: '',
      answer: '',
    },
  ]);

  const [removingId, setRemovingId] = useState<string | null>(null);

  const addFaq = () => {
    const lastId = faqs.length > 0 ? parseInt(faqs[faqs.length - 1].id, 10) : 0;
    const newFaq: Question = {
      id: (lastId + 1).toString(),
      question: '',
      answer: '',
    };
    setFaqs([...faqs, newFaq]);
  };

  const removeFaq = (id: string) => {
    setRemovingId(id);
    setTimeout(() => {
      setFaqs((prev) => prev.filter((faq) => faq.id !== id));
      setRemovingId(null);
    }, 300);
  };

  const updateFaq = (id: string, field: keyof Question, value: string) => {
    setFaqs(
      faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq))
    );
  };

  return (
    <div className="w-full space-y-6">
      {faqs.map((faq, index) => (
        <div
          key={faq.id}
          className={`w-full relative rounded-2xl border border-border-card p-6 transition-all duration-300 ease-in-out
          ${removingId === faq.id ? 'animate-fadeOut' : 'animate-fadeIn'}`}
          style={{
            animationDelay: `${index * 0.05}s`,
          }}
        >
          <div className="flex items-center justify-between mb-8 absolute top-3 right-4">
            <button
              onClick={() => removeFaq(faq.id)}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <Trash size={24} />
            </button>
          </div>

          <FAQFormSection faq={faq} onUpdate={updateFaq} />
        </div>
      ))}
      <div className="w-full h-16 rounded-[20px] border border-border-card p-6">
        <button
          onClick={addFaq}
          className=" w-fit h-full flex justify-center items-center  gap-2 text-green-400 hover:text-green-300 transition-colors duration-200 group"
        >
          <Plus size={20} />
          <span className="font-medium">Add one more</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-fadeOut {
          animation: fadeOut 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

interface FAQFormSectionProps {
  faq: Question;
  onUpdate: (id: string, field: keyof Question, value: string) => void;
}

function FAQFormSection({ faq, onUpdate }: FAQFormSectionProps) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <FormInput
        label={`Question ${faq.id}`}
        value={faq.question}
        placeholder={`Question ${faq.id}`}
        onChange={(e) => onUpdate(faq.id, 'question', e.target.value)}
      />
      <FormInput
        label={`Answer ${faq.id}`}
        value={faq.answer}
        placeholder={`Answer ${faq.id}`}
        onChange={(e) => onUpdate(faq.id, 'answer', e.target.value)}
      />
    </div>
  );
}

export default function QuestionForm() {
  return (
    <div className="flex flex-col w-full gap-6">
      <span className="text-3xl text-white font-normal">FAQs</span>
      <FAQForm />
    </div>
  );
}
