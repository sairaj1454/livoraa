import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useFestivalEmailJS } from '../hooks/useFestivalEmailJS';

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface EmailCampaignProps {
  customers: Customer[];
  onClose: () => void;
}

const EmailCampaign: React.FC<EmailCampaignProps> = ({ customers, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [sending, setSending] = useState(false);
  
  const { sendFestivalEmail, getFestivalTemplate } = useFestivalEmailJS();

  const handleTemplateChange = (template: string) => {
    if (template === 'custom') {
      setSubject('');
      setMessage('');
    } else {
      const festivalTemplate = getFestivalTemplate(template as any);
      setSubject(festivalTemplate.subject);
      setMessage(festivalTemplate.message);
    }
    setSelectedTemplate(template);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      
      // Send emails to all selected customers
      for (const customer of customers) {
        const personalizedMessage = message.replace(/\[Customer Name\]/g, customer.name);
        await sendFestivalEmail({
          to: customer.email,
          toName: customer.name,
          subject,
          message: personalizedMessage,
        });
      }

      toast.success('Festival campaign sent successfully!');
      setSubject('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending festival campaign:', error);
      toast.error('Failed to send festival campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Festival Email Campaign</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Festival Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="custom">Custom Template</option>
              <option value="newYear">New Year 2025</option>
              <option value="christmas">Christmas Special</option>
              <option value="diwali">Diwali Special</option>
              <option value="holi">Holi Celebration</option>
              <option value="dussehra">Dussehra Offers</option>
              <option value="ganeshChaturthi">Ganesh Chaturthi Special</option>
              <option value="sankranti">Sankranti Special</option>
              <option value="valentines">Valentine's Day</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-64"
              placeholder="Enter your message (use [Customer Name] for personalization)"
              required
            />
            <p className="mt-1 text-sm text-gray-600">
              Use [Customer Name] to personalize the message for each customer
            </p>
          </div>

          <div className="flex justify-between items-center pt-4">
            <span className="text-sm text-gray-700">
              Sending to <span className="font-medium text-blue-600">{customers.length}</span> customer{customers.length !== 1 ? 's' : ''}
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Campaign'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailCampaign;
