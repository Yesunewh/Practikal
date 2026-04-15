import React, { useState } from 'react';
import { MessageCircle, Book, Video, Mail, Phone, Clock } from 'lucide-react';

export default function Support() {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [message, setMessage] = useState('');

  const categories = [
    { id: 'general', label: 'General Questions' },
    { id: 'technical', label: 'Technical Issues' },
    { id: 'account', label: 'Account & Billing' },
    { id: 'content', label: 'Course Content' }
  ];

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'You can reset your password by clicking the "Forgot Password" link on the login page.'
    },
    {
      question: 'How are XP points calculated?',
      answer: 'XP points are awarded based on challenge completion, accuracy, and time taken. Bonus points are given for streaks.'
    },
    {
      question: 'Can I retake challenges?',
      answer: 'Yes, you can retake any challenge to improve your score and understanding.'
    },
    {
      question: 'How do I track my organization\'s progress?',
      answer: 'Administrators can access detailed analytics and progress reports through the admin dashboard.'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the support request
    alert('Support request submitted! We\'ll get back to you within 24 hours.');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-emerald-900 text-white py-8">
        <div className="px-8">
          <h1 className="text-3xl font-bold mb-4">Support Center</h1>
          <p className="text-emerald-200">Get help with your cybersecurity learning journey</p>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Options */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Mail className="text-emerald-500" size={20} />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600">support@practikal.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Phone className="text-emerald-500" size={20} />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <Clock className="text-emerald-500" size={20} />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-sm text-gray-600">Mon-Fri, 9AM-6PM EST</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Resources</h2>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Book className="text-emerald-500" size={20} />
                  <span>User Guide</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Video className="text-emerald-500" size={20} />
                  <span>Video Tutorials</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <MessageCircle className="text-emerald-500" size={20} />
                  <span>Community Forum</span>
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Form */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Describe your question or issue..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
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