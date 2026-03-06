"use client";

import { motion } from "motion/react";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Is my medical data secure?",
    answer: "Absolutely. We use bank-grade AES-256 encryption for all data at rest and in transit. We are fully HIPAA compliant and never sell your data to third parties."
  },
  {
    question: "What kind of reports can I upload?",
    answer: "We support PDF, JPG, and PNG formats. Our AI is trained on a wide variety of lab reports including blood work, lipid profiles, thyroid function tests, and more."
  },
  {
    question: "Is the analysis reviewed by doctors?",
    answer: "Our AI provides insights based on established medical benchmarks, but it is not a substitute for professional medical advice. Always consult your doctor for diagnosis and treatment."
  },
  {
    question: "Can I track my family's health too?",
    answer: "Yes! You can create profiles for family members and manage all their health reports in one secure dashboard."
  },
  {
    question: "Is there a free trial?",
    answer: "Yes, you can analyze your first 3 reports for free to experience the power of MediLens. No credit card required."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-600">Got questions? We've got answers.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-bold text-slate-900 text-lg">{faq.question}</span>
                {openIndex === index ? (
                  <Minus className="h-5 w-5 text-blue-600" />
                ) : (
                  <Plus className="h-5 w-5 text-slate-400" />
                )}
              </button>
              <motion.div
                initial={false}
                animate={{ height: openIndex === index ? "auto" : 0 }}
                className="overflow-hidden"
              >
                <div className="p-6 pt-0 text-slate-600 leading-relaxed border-t border-slate-100 mt-2">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
