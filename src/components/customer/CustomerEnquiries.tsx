import React, { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

interface Enquiry {
  id: string;
  subject: string;
  message: string;
  status: string;
  date: string;
  response?: string;
}

const CustomerEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEnquiryForm, setShowNewEnquiryForm] = useState(false);
  const [newEnquiry, setNewEnquiry] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const enquiriesQuery = query(
        collection(db, 'enquiries'),
        where('email', '==', user.email)
      );
      
      const querySnapshot = await getDocs(enquiriesQuery);
      const enquiriesList: Enquiry[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        enquiriesList.push({
          id: doc.id,
          subject: data.subject,
          message: data.message,
          status: data.status,
          date: new Date(data.timestamp?.toDate()).toLocaleDateString(),
          response: data.response,
        });
      });

      setEnquiries(enquiriesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      toast.error('Failed to load enquiries');
      setLoading(false);
    }
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      if (!user) return;

      const enquiryData = {
        subject: newEnquiry.subject,
        message: newEnquiry.message,
        email: user.email,
        name: user.displayName,
        status: 'pending',
        timestamp: new Date(),
      };

      await addDoc(collection(db, 'enquiries'), enquiryData);
      
      toast.success('Enquiry submitted successfully');
      setNewEnquiry({ subject: '', message: '' });
      setShowNewEnquiryForm(false);
      fetchEnquiries();
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      toast.error('Failed to submit enquiry');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Enquiries</h2>
        <button
          onClick={() => setShowNewEnquiryForm(!showNewEnquiryForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          {showNewEnquiryForm ? 'Cancel' : 'New Enquiry'}
        </button>
      </div>

      {showNewEnquiryForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submit New Enquiry</h3>
          <form onSubmit={handleSubmitEnquiry} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={newEnquiry.subject}
                onChange={(e) => setNewEnquiry(prev => ({ ...prev, subject: e.target.value }))}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                value={newEnquiry.message}
                onChange={(e) => setNewEnquiry(prev => ({ ...prev, message: e.target.value }))}
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Submit Enquiry
              </button>
            </div>
          </form>
        </div>
      )}

      {enquiries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No enquiries found</p>
        </div>
      ) : (
        enquiries.map((enquiry) => (
          <div
            key={enquiry.id}
            className="bg-white shadow rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{enquiry.subject}</h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    enquiry.status
                  )}`}
                >
                  {enquiry.status}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Submitted on {enquiry.date}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Your Message:</h4>
                  <p className="mt-1 text-sm text-gray-600">{enquiry.message}</p>
                </div>

                {enquiry.response && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium text-gray-900">Response:</h4>
                    <p className="mt-1 text-sm text-gray-600">{enquiry.response}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CustomerEnquiries;
