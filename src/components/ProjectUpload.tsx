import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ProjectWorker {
  name: string;
  role: string;
  contactNumber: string;
}

interface ProjectData {
  title: string;
  description: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  location: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  startDate: string;
  endDate: string;
  budget: number;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  workers: ProjectWorker[];
  payments: {
    totalAmount: number;
    advanceAmount: number;
    remainingAmount: number;
    paymentStatus: 'Pending' | 'Partially Paid' | 'Fully Paid';
    nextPaymentDate: string;
  };
}

const ProjectUpload: React.FC = () => {
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    description: '',
    client: '',
    clientEmail: '',
    clientPhone: '',
    location: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    startDate: '',
    endDate: '',
    budget: 0,
    status: 'Planning',
    workers: [],
    payments: {
      totalAmount: 0,
      advanceAmount: 0,
      remainingAmount: 0,
      paymentStatus: 'Pending',
      nextPaymentDate: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [worker, setWorker] = useState<ProjectWorker>({
    name: '',
    role: '',
    contactNumber: ''
  });

  const updatePaymentStatus = (total: number, advance: number) => {
    if (advance === 0) return 'Pending';
    if (advance >= total) return 'Fully Paid';
    return 'Partially Paid';
  };

  const handlePaymentChange = (field: string, value: number | string) => {
    setProjectData(prev => {
      const total = field === 'totalAmount' ? Number(value) : prev.payments.totalAmount;
      const advance = field === 'advanceAmount' ? Number(value) : prev.payments.advanceAmount;
      
      return {
        ...prev,
        payments: {
          ...prev.payments,
          [field]: value,
          remainingAmount: total - advance,
          paymentStatus: updatePaymentStatus(total, advance)
        }
      };
    });
  };

  const handleAddWorker = () => {
    if (!worker.name || !worker.role || !worker.contactNumber) {
      toast.error('Please fill in all worker details');
      return;
    }
    setProjectData(prev => ({
      ...prev,
      workers: [...prev.workers, worker]
    }));
    setWorker({ name: '', role: '', contactNumber: '' });
  };

  const handleRemoveWorker = (index: number) => {
    setProjectData(prev => ({
      ...prev,
      workers: prev.workers.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectData.title || !projectData.client || !projectData.startDate || !projectData.clientEmail || !projectData.address.street || !projectData.address.city || !projectData.address.state || !projectData.address.pincode || !projectData.clientPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const projectToSubmit = {
        ...projectData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'projects'), projectToSubmit);
      
      // Reset form
      setProjectData({
        title: '',
        description: '',
        client: '',
        clientEmail: '',
        clientPhone: '',
        location: '',
        address: {
          street: '',
          city: '',
          state: '',
          pincode: ''
        },
        startDate: '',
        endDate: '',
        budget: 0,
        status: 'Planning',
        workers: [],
        payments: {
          totalAmount: 0,
          advanceAmount: 0,
          remainingAmount: 0,
          paymentStatus: 'Pending',
          nextPaymentDate: ''
        }
      });
      
      toast.success('Project uploaded successfully!');
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error uploading project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-blue-600">Add New Project</h2>
      <ToastContainer position="bottom-right" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={projectData.title}
                onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="text"
                  value={projectData.budget || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setProjectData(prev => ({
                      ...prev,
                      budget: value ? Number(value) : 0
                    }));
                  }}
                  className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  placeholder="Enter budget amount"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={projectData.status}
                onChange={(e) => setProjectData(prev => ({ ...prev, status: e.target.value as ProjectData['status'] }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={projectData.description}
                onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-32 text-black"
              />
            </div>
          </div>
        </div>

        {/* Client Details Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Client Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                value={projectData.client}
                onChange={(e) => setProjectData(prev => ({ ...prev, client: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Phone *
              </label>
              <input
                type="tel"
                value={projectData.clientPhone}
                onChange={(e) => setProjectData(prev => ({ ...prev, clientPhone: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                required
                pattern="[0-9]{10}"
                placeholder="10-digit phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Email *
              </label>
              <input
                type="email"
                value={projectData.clientEmail}
                onChange={(e) => setProjectData(prev => ({ ...prev, clientEmail: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                required
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={projectData.location}
                onChange={(e) => setProjectData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={projectData.startDate}
              onChange={(e) => setProjectData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected End Date
            </label>
            <input
              type="date"
              value={projectData.endDate}
              onChange={(e) => setProjectData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="text"
                value={projectData.budget || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setProjectData(prev => ({
                    ...prev,
                    budget: value ? Number(value) : 0
                  }));
                }}
                className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Enter budget amount"
              />
            </div>
          </div>
        </div>

        {/* Address Fields */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Project Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                value={projectData.address.street}
                onChange={(e) => setProjectData(prev => ({
                  ...prev,
                  address: { ...prev.address, street: e.target.value }
                }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                required
                placeholder="Street address, apartment, suite, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={projectData.address.city}
                onChange={(e) => setProjectData(prev => ({
                  ...prev,
                  address: { ...prev.address, city: e.target.value }
                }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                required
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                value={projectData.address.state}
                onChange={(e) => setProjectData(prev => ({
                  ...prev,
                  address: { ...prev.address, state: e.target.value }
                }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                required
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN Code *
              </label>
              <input
                type="text"
                value={projectData.address.pincode}
                onChange={(e) => setProjectData(prev => ({
                  ...prev,
                  address: { ...prev.address, pincode: e.target.value }
                }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                required
                pattern="[0-9]{6}"
                placeholder="6-digit PIN code"
              />
            </div>
          </div>
        </div>

        {/* Workers Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Project Workers</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Worker Name"
              value={worker.name}
              onChange={(e) => setWorker(prev => ({ ...prev, name: e.target.value }))}
              className="p-2 border rounded text-black"
            />
            <input
              type="text"
              placeholder="Role"
              value={worker.role}
              onChange={(e) => setWorker(prev => ({ ...prev, role: e.target.value }))}
              className="p-2 border rounded text-black"
            />
            <input
              type="tel"
              placeholder="Contact Number"
              value={worker.contactNumber}
              onChange={(e) => setWorker(prev => ({ ...prev, contactNumber: e.target.value }))}
              className="p-2 border rounded text-black"
            />
          </div>
          
          <button
            type="button"
            onClick={handleAddWorker}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-black"
          >
            Add Worker
          </button>

          <div className="mt-4 space-y-2">
            {projectData.workers.map((w, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <div>
                  <span className="font-medium">{w.name}</span> - {w.role} ({w.contactNumber})
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveWorker(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payments Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Project Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="text"
                  value={projectData.payments.totalAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handlePaymentChange('totalAmount', value ? Number(value) : 0);
                  }}
                  className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Advance Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="text"
                  value={projectData.payments.advanceAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const numValue = value ? Number(value) : 0;
                    if (numValue <= projectData.payments.totalAmount) {
                      handlePaymentChange('advanceAmount', numValue);
                    }
                  }}
                  className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  placeholder="Enter amount"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remaining Amount
              </label>
              <div className="bg-gray-100 p-3 rounded-md font-medium">
                ₹{projectData.payments.remainingAmount.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <div className={`p-3 rounded-md font-medium ${
                projectData.payments.paymentStatus === 'Fully Paid' 
                  ? 'bg-green-100 text-green-800'
                  : projectData.payments.paymentStatus === 'Partially Paid'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {projectData.payments.paymentStatus}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Payment Date
              </label>
              <input
                type="date"
                value={projectData.payments.nextPaymentDate}
                onChange={(e) => handlePaymentChange('nextPaymentDate', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 text-black"
          >
            {loading ? 'Uploading...' : 'Submit Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectUpload;
