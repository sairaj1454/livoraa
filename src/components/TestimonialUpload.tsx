import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface TestimonialUploadProps {
  onTestimonialAdded: () => void;
}

const TestimonialUpload: React.FC<TestimonialUploadProps> = ({ onTestimonialAdded }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'testimonials'), {
        name,
        content,
        rating,
        date: new Date().toISOString().split('T')[0]
      });
      
      setName('');
      setContent('');
      setRating(5);
      toast.success('Testimonial added successfully');
      onTestimonialAdded();
    } catch (error) {
      console.error('Error adding testimonial:', error);
      toast.error('Error adding testimonial');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-black mb-6">Add New Testimonial</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
            Client Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-400"
            placeholder="Enter client name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Rating
          </label>
          <div className="flex gap-1">
            {[...Array(5)].map((_, index) => {
              const ratingValue = index + 1;
              return (
                <button
                  type="button"
                  key={ratingValue}
                  onClick={() => setRating(ratingValue)}
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(null)}
                  className="text-2xl focus:outline-none"
                >
                  <FaStar
                    className={`transition-colors ${
                      ratingValue <= (hover ?? rating)
                        ? 'text-blue-600'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-black mb-1">
            Testimonial Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-gray-400"
            placeholder="Write testimonial content"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Adding...' : 'Add Testimonial'}
        </button>
      </form>
    </div>
  );
};

export default TestimonialUpload;
