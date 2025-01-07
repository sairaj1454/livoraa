import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomerSearchPopup from './CustomerSearchPopup';
import EmployeeSearchPopup from './EmployeeSearchPopup';

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
        }
      }));
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

        {/* Customer Selection */}
        <div className="space-y-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-gray-700">
                  Customer Details
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setManualEntry(!manualEntry);
                    if (!manualEntry) {
                      setSelectedCustomer('');
                      setProjectData(prev => ({
                        ...prev,
                        client: '',
                        clientEmail: '',
                        clientPhone: '',
                        address: {
                          ...prev.address,
                          street: '',
                          city: '',
                          state: '',
                          pincode: ''
                        }
                      }));
                    }
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  {manualEntry ? 'Select Existing Customer' : 'Enter Manually'}
                </button>
              </div>

              {!manualEntry ? (
                <div className="relative">
                  <input
                    type="text"
                    value={customers.find(c => c.id === selectedCustomer)?.name || ''}
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer text-black"
                    placeholder="Click to select customer"
                    onClick={() => setIsCustomerPopupOpen(true)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      name="client"
                      value={projectData.client}
                      onChange={(e) => setProjectData({ ...projectData, client: e.target.value })}
                      className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out hover:border-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      name="clientEmail"
                      value={projectData.clientEmail}
                      onChange={(e) => setProjectData({ ...projectData, clientEmail: e.target.value })}
                      className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out hover:border-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      name="clientPhone"
                      value={projectData.clientPhone}
                      onChange={(e) => setProjectData({ ...projectData, clientPhone: e.target.value })}
                      className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out hover:border-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="street"
                      value={projectData.address.street}
                      onChange={(e) => setProjectData(prev => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))}
                      className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out hover:border-indigo-300"
                      placeholder="Enter street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={projectData.address.city}
                      onChange={(e) => setProjectData(prev => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))}
                      className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out hover:border-indigo-300"
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={projectData.address.state}
                      onChange={(e) => setProjectData(prev => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))}
                      className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out hover:border-indigo-300"
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={projectData.address.pincode}
                      onChange={(e) => setProjectData(prev => ({
                        ...prev,
                        address: { ...prev.address, pincode: e.target.value }
                      }))}
                      pattern="[0-9]{6}"
                      className="block w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out hover:border-indigo-300"
                      placeholder="Enter 6-digit PIN code"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Project Title */}
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

        <CustomerSearchPopup
          customers={customers}
          isOpen={isCustomerPopupOpen}
          onClose={() => setIsCustomerPopupOpen(false)}
          onSelect={(customer) => handleCustomerSelect(customer.id)}
        />

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
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Project Workers</h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">Worker Name</label>
                  <div className="mt-1 flex">
                    <input
                      type="text"
                      value={worker.name}
                      onChange={(e) => setWorker({ ...worker, name: e.target.value })}
                      className="flex-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => setIsEmployeePopupOpen(true)}
                      className="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Select Employee
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <input
                    type="text"
                    value={worker.role}
                    onChange={(e) => setWorker(prev => ({ ...prev, role: e.target.value }))}
                    className="block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="tel"
                    value={worker.contactNumber}
                    onChange={(e) => setWorker(prev => ({ ...prev, contactNumber: e.target.value }))}
                    className="block w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>
            </div>
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

        <EmployeeSearchPopup
          employees={employees}
          isOpen={isEmployeePopupOpen}
          onClose={() => setIsEmployeePopupOpen(false)}
          onSelect={handleEmployeeSelect}
        />

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
