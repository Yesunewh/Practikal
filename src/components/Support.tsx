import React, { useMemo, useState } from 'react';
import { MessageCircle, Book, Video, Mail, Phone, Clock } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export default function Support() {
  const { messages } = useI18n();
  const s = messages.support;
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [message, setMessage] = useState('');

  const categories = useMemo(
    () => [
      { id: 'general', label: s.catGeneral },
      { id: 'technical', label: s.catTechnical },
      { id: 'account', label: s.catAccount },
      { id: 'content', label: s.catContent },
    ],
    [s.catGeneral, s.catTechnical, s.catAccount, s.catContent],
  );

  const faqs = useMemo(
    () => [
      { question: s.faq1q, answer: s.faq1a },
      { question: s.faq2q, answer: s.faq2a },
      { question: s.faq3q, answer: s.faq3a },
      { question: s.faq4q, answer: s.faq4a },
    ],
    [s.faq1q, s.faq1a, s.faq2q, s.faq2a, s.faq3q, s.faq3a, s.faq4q, s.faq4a],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(s.submitAlert);
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto">
      <div className="bg-emerald-900 text-white py-8">
        <div className="px-8">
          <h1 className="text-3xl font-bold mb-4">{s.title}</h1>
          <p className="text-emerald-200">{s.subtitle}</p>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold mb-4">{s.contactUs}</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Mail className="text-emerald-500" size={20} />
                  <div>
                    <p className="font-medium">{s.emailSupport}</p>
                    <p className="text-sm text-gray-600">{s.emailValue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Phone className="text-emerald-500" size={20} />
                  <div>
                    <p className="font-medium">{s.phoneSupport}</p>
                    <p className="text-sm text-gray-600">{s.phoneValue}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Clock className="text-emerald-500" size={20} />
                  <div>
                    <p className="font-medium">{s.businessHours}</p>
                    <p className="text-sm text-gray-600">{s.hoursValue}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">{s.resources}</h2>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Book className="text-emerald-500" size={20} />
                  <span>{s.userGuide}</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Video className="text-emerald-500" size={20} />
                  <span>{s.videoTutorials}</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <MessageCircle className="text-emerald-500" size={20} />
                  <span>{s.communityForum}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">{s.sendMessage}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{s.category}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{s.message}</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={s.messagePlaceholder}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {s.sendButton}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">{s.faqTitle}</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
