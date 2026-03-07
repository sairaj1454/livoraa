import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import {
  BriefcaseIcon,
  UserIcon,
  CalendarDaysIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  MapPinIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import CustomerSearchPopup from './CustomerSearchPopup';
import EmployeeSearchPopup from './EmployeeSearchPopup';
import { createNotification } from '../utils/notifications';

interface ProjectWorker {
  id: string;
  name: string;
  role: string;
  contactNumber: string;
  position: string;
  department?: string;
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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
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
    id: '',
    name: '',
    role: '',
    contactNumber: '',
    position: '',
    department: ''
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [manualEntry, setManualEntry] = useState(false);
  const [isCustomerPopupOpen, setIsCustomerPopupOpen] = useState(false);

  const [employees, setEmployees] = useState<any[]>([]);
  const [isEmployeePopupOpen, setIsEmployeePopupOpen] = useState(false);

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

  const handleEmployeeSelect = (selectedEmployee: any) => {
    setWorker({
      id: selectedEmployee.id,
      name: selectedEmployee.name,
      role: selectedEmployee.position, // Set initial role as their position
      contactNumber: selectedEmployee.phone,
      position: selectedEmployee.position,
      department: selectedEmployee.department || ''
    });
    setIsEmployeePopupOpen(false);
  };

  const handleAddWorker = () => {
    if (!worker.id || !worker.name || !worker.role || !worker.contactNumber) {
      toast.error('Please select an employee and fill in all worker details');
      return;
    }

    // Check if worker already exists in the project
    const workerExists = projectData.workers.some(w => w.id === worker.id);
    if (workerExists) {
      toast.error('This employee is already added to the project');
      return;
    }

    setProjectData(prev => ({
      ...prev,
      workers: [...prev.workers, {
        id: worker.id,
        name: worker.name,
        role: worker.role,
        contactNumber: worker.contactNumber,
        position: worker.position,
        department: worker.department
      }]
    }));

    // Reset worker form
    setWorker({
      id: '',
      name: '',
      role: '',
      contactNumber: '',
      position: '',
      department: ''
    });
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
        title: projectData.title,
        description: projectData.description,
        client: projectData.client,
        clientEmail: projectData.clientEmail,
        clientPhone: projectData.clientPhone,
        location: projectData.location,
        address: {
          street: projectData.address.street,
          city: projectData.address.city,
          state: projectData.address.state,
          pincode: projectData.address.pincode
        },
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        status: projectData.status,
        workers: projectData.workers.map(worker => ({
          id: worker.id,
          name: worker.name,
          role: worker.role,
          contactNumber: worker.contactNumber,
          position: worker.position,
          department: worker.department || ''
        })),
        payments: {
          totalAmount: Number(projectData.payments.totalAmount),
          advanceAmount: Number(projectData.payments.advanceAmount),
          remainingAmount: Number(projectData.payments.remainingAmount),
          paymentStatus: projectData.payments.paymentStatus,
          nextPaymentDate: projectData.payments.nextPaymentDate
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add the project to the projects collection
      const projectRef = await addDoc(collection(db, 'projects'), projectToSubmit);

      // Update each employee's document with the project reference
      const updatePromises = projectData.workers.map(async (worker) => {
        if (worker.id) {
          const employeeRef = doc(db, 'employees', worker.id);
          await updateDoc(employeeRef, {
            projects: arrayUnion({
              projectId: projectRef.id,
              projectTitle: projectData.title,
              role: worker.role,
              startDate: projectData.startDate,
              status: projectData.status
            })
          });
        }
      });

      // Wait for all employee updates to complete
      await Promise.all(updatePromises);

      // Notify customer
      await createNotification(
        projectData.clientEmail,
        'Project Created!',
        `Your new project "${projectData.title}" has been successfully set up. Welcome to LIVORAA ATELIER!`,
        'project_update',
        '/customer/projects'
      );

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

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollection = collection(db, 'customers');
        const customersSnapshot = await getDocs(customersCollection);
        const customersList = customersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Customer));
        setCustomers(customersList);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const employeesRef = collection(db, 'employees');
      const employeesSnapshot = await getDocs(query(employeesRef));
      const employeesList = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Error loading employees');
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customerId);
      const fullAddress = `${customer.address.street}, ${customer.address.city}, ${customer.address.state} - ${customer.address.pincode}`;
      setProjectData(prev => ({
        ...prev,
        client: customer.name,
        clientEmail: customer.email,
        clientPhone: customer.phone,
        address: {
          street: customer.address.street,
          city: customer.address.city,
          state: customer.address.state,
          pincode: customer.address.pincode
        },
        location: fullAddress
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <ToastContainer position="bottom-right" />

      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#4E67E8] via-[#8B5CF6] to-[#D946EF] rounded-t-3xl p-8 text-white shadow-xl"
      >
        <h2 className="text-3xl font-bold">Create New Project</h2>
        <p className="text-indigo-100 opacity-90 mt-1">Add a new interior design project to your portfolio</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="bg-gray-50/50 rounded-b-3xl shadow-xl border-x border-b border-gray-100 p-6 md:p-10 space-y-10">

        {/* Section 1: Project Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <BriefcaseIcon className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Project Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Project Title *</label>
              <input
                type="text"
                value={projectData.title}
                onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-black"
                placeholder="Enter project title"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Project Budget *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="text"
                  value={projectData.budget || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setProjectData(prev => ({ ...prev, budget: value ? Number(value) : 0 }));
                  }}
                  className="w-full p-4 pl-10 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-black"
                  placeholder="Enter budget amount"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Project Status</label>
            <div className="relative">
              <select
                value={projectData.status}
                onChange={(e) => setProjectData(prev => ({ ...prev, status: e.target.value as ProjectData['status'] }))}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer font-medium text-black"
              >
                <option value="Planning">📅 Planning</option>
                <option value="In Progress">🏗️ In Progress</option>
                <option value="On Hold">⏸️ On Hold</option>
                <option value="Completed">✅ Completed</option>
              </select>
              <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Project Description</label>
            <textarea
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the project details, requirements, and specifications..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none min-h-[120px] text-black"
            />
          </div>
        </motion.div>

        {/* Section 2: Customer Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2.5 rounded-xl">
                <UserIcon className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Customer Information</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setManualEntry(!manualEntry);
                if (!manualEntry) {
                  setSelectedCustomer('');
                  setProjectData(prev => ({
                    ...prev,
                    client: '', clientEmail: '', clientPhone: '',
                    address: { ...prev.address, street: '', city: '', state: '', pincode: '' }
                  }));
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <PencilSquareIcon className="w-4 h-4" />
              {manualEntry ? 'Select Existing' : 'Enter Manually'}
            </button>
          </div>

          {!manualEntry ? (
            <div className="relative group" onClick={() => setIsCustomerPopupOpen(true)}>
              <input
                type="text"
                value={customers.find(c => c.id === selectedCustomer)?.name || ''}
                readOnly
                className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none cursor-pointer text-black"
                placeholder="Click to select an existing customer"
              />
              <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 group-hover:text-indigo-500 transition-colors" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input type="text" placeholder="Customer Name" value={projectData.client} onChange={(e) => setProjectData({ ...projectData, client: e.target.value })} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-black" />
              <input type="email" placeholder="Customer Email" value={projectData.clientEmail} onChange={(e) => setProjectData({ ...projectData, clientEmail: e.target.value })} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-black" />
              <input type="tel" placeholder="Customer Phone" value={projectData.clientPhone} onChange={(e) => setProjectData({ ...projectData, clientPhone: e.target.value })} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-black" />
              <input type="text" placeholder="Street Address" value={projectData.address.street} onChange={(e) => setProjectData(p => ({ ...p, address: { ...p.address, street: e.target.value } }))} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-black" />
              <input type="text" placeholder="City" value={projectData.address.city} onChange={(e) => setProjectData(p => ({ ...p, address: { ...p.address, city: e.target.value } }))} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-black" />
              <input type="text" placeholder="State" value={projectData.address.state} onChange={(e) => setProjectData(p => ({ ...p, address: { ...p.address, state: e.target.value } }))} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-black" />
              <input type="text" placeholder="PIN Code" value={projectData.address.pincode} onChange={(e) => setProjectData(p => ({ ...p, address: { ...p.address, pincode: e.target.value } }))} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-black" />
            </div>
          )}

          <div className="space-y-2 pt-4">
            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Project Location</label>
            <div className="relative">
              <input
                type="text"
                value={projectData.location}
                onChange={(e) => setProjectData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-black"
                placeholder="Specific location or landmark details"
              />
              <MapPinIcon className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </motion.div>

        {/* Section 3: Project Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
            <div className="bg-purple-50 p-2.5 rounded-xl">
              <CalendarDaysIcon className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Project Timeline</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Start Date *</label>
              <input
                type="date"
                value={projectData.startDate}
                onChange={(e) => setProjectData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-black"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Expected End Date</label>
              <input
                type="date"
                value={projectData.endDate}
                onChange={(e) => setProjectData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-black"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 4: Project Team */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
            <div className="bg-orange-50 p-2.5 rounded-xl">
              <UsersIcon className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Project Team</h3>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Employee Name</label>
                <button
                  type="button"
                  onClick={() => setIsEmployeePopupOpen(true)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-left text-gray-400 font-medium hover:border-indigo-300 transition-colors flex items-center justify-between text-black"
                >
                  {worker.name || 'Select an employee'}
                  <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Role in Project</label>
                <input
                  type="text"
                  value={worker.role}
                  onChange={(e) => setWorker(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                  placeholder="e.g., Lead Designer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Contact Number</label>
                <input
                  type="tel"
                  value={worker.contactNumber}
                  onChange={(e) => setWorker(prev => ({ ...prev, contactNumber: e.target.value }))}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddWorker}
              className="w-full md:w-auto px-6 py-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100"
            >
              <PlusIcon className="w-6 h-6" />
              Add Team Member
            </button>

            {projectData.workers.length > 0 && (
              <div className="space-y-3 mt-6">
                {projectData.workers.map((w, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-bold text-indigo-600">
                        {w.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{w.name}</p>
                        <p className="text-sm text-gray-400">{w.role} • {w.contactNumber}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWorker(index)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="w-6 h-6" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Section 5: Payment Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
            <div className="bg-emerald-50 p-2.5 rounded-xl">
              <CurrencyRupeeIcon className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Payment Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Project Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="text"
                  value={projectData.payments.totalAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handlePaymentChange('totalAmount', value ? Number(value) : 0);
                  }}
                  className="w-full p-4 pl-10 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                  placeholder="Enter total amount"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Advance Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                <input
                  type="text"
                  value={projectData.payments.advanceAmount || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handlePaymentChange('advanceAmount', value ? Number(value) : 0);
                  }}
                  className="w-full p-4 pl-10 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                  placeholder="Enter advance amount"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Remaining Amount</label>
              <div className="w-full p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xl font-bold text-indigo-600">
                ₹{projectData.payments.remainingAmount.toLocaleString()}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Payment Status</label>
              <div className={`w-full p-4 rounded-2xl font-bold text-center border flex items-center justify-center gap-2 ${projectData.payments.paymentStatus === 'Fully Paid'
                ? 'bg-green-50 border-green-100 text-green-600'
                : 'bg-red-50 border-red-100 text-red-600'
                }`}>
                <span className={`w-2 h-2 rounded-full ${projectData.payments.paymentStatus === 'Fully Paid' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                {projectData.payments.paymentStatus.toUpperCase()}
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Next Payment Date</label>
              <input
                type="date"
                value={projectData.payments.nextPaymentDate}
                onChange={(e) => handlePaymentChange('nextPaymentDate', e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </motion.div>

        <CustomerSearchPopup
          customers={customers}
          isOpen={isCustomerPopupOpen}
          onClose={() => setIsCustomerPopupOpen(false)}
          onSelect={(customer) => handleCustomerSelect(customer.id)}
        />
        <EmployeeSearchPopup
          employees={employees}
          isOpen={isEmployeePopupOpen}
          onClose={() => setIsEmployeePopupOpen(false)}
          onSelect={handleEmployeeSelect}
        />

        {/* Submit Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-xl font-bold rounded-3xl shadow-2xl hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <BriefcaseIcon className="w-6 h-6" />
            )}
            {loading ? 'Creating Project...' : 'Create Project'}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default ProjectUpload;
