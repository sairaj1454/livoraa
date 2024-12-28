import React, { useState, useEffect } from 'react';
import { FaStar, FaTrash } from 'react-icons/fa';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast, ToastContainer } from 'react-toastify';
import TestimonialUpload from './TestimonialUpload';

interface Testimonial {
  id?: string;
  name: string;
  date: string;
  content: string;
  rating: number;
}

const TestimonialManager: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'testimonials'));
      const testimonialData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Testimonial[];
      setTestimonials(testimonialData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error('Error loading testimonials');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await deleteDoc(doc(db, 'testimonials', id));
        setTestimonials(prev => prev.filter(testimonial => testimonial.id !== id));
        toast.success('Testimonial deleted successfully');
      } catch (error) {
        console.error('Error deleting testimonial:', error);
        toast.error('Error deleting testimonial');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Testimonial Management</h1>
          <p className="mt-2 text-sm text-gray-600">Add and manage client testimonials for your website.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <TestimonialUpload onTestimonialAdded={fetchTestimonials} />
            </div>
          </div>

          {/* Testimonials List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  All Testimonials
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({testimonials.length} total)
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                {testimonials.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No testimonials yet. Add your first one!</p>
                  </div>
                ) : (
                  testimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className="group bg-white border border-gray-100 rounded-lg p-6 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0">
                            {testimonial.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-black group-hover:text-blue-600 transition-colors">
                              {testimonial.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{testimonial.date}</p>
                            <div className="flex items-center mt-2 space-x-1">
                              {[...Array(testimonial.rating)].map((_, index) => (
                                <FaStar key={index} className="text-blue-600 w-4 h-4" />
                              ))}
                            </div>
                            <p className="mt-3 text-black text-sm">{testimonial.content}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(testimonial.id!)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-2 opacity-0 group-hover:opacity-100"
                          title="Delete testimonial"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default TestimonialManager;
