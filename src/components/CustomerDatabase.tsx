import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EmailCampaign from './EmailCampaign';
import {
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  lastContact: string;
  projects?: string[];
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  selected?: boolean;
  sourceCollection: 'customers' | 'enquiries' | 'projects';
  sourceId: string;
}

const CustomerDatabase: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showEmailCampaign, setShowEmailCampaign] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const customerSet = new Map<string, Customer>();

      // Fetch registered customers
      const customersQuery = query(collection(db, 'customers'));
      const customersSnapshot = await getDocs(customersQuery);

      customersSnapshot.forEach((doc) => {
        const data = doc.data();
        const email = data.email.toLowerCase();

        customerSet.set(email, {
          id: doc.id,
          name: data.name,
          email: email,
          phone: data.phone || '',
          source: 'Registered Customer',
          lastContact: data.createdAt || new Date().toLocaleDateString(),
          address: data.address,
          selected: false,
          sourceCollection: 'customers',
          sourceId: doc.id
        });
      });

      // Fetch customers from enquiry forms
      const enquiriesQuery = query(collection(db, 'enquiries'));
      const enquiriesSnapshot = await getDocs(enquiriesQuery);

      enquiriesSnapshot.forEach((doc) => {
        const data = doc.data();
        const email = data.email.toLowerCase();

        if (!customerSet.has(email)) {
          customerSet.set(email, {
            id: doc.id,
            name: data.name,
            email: email,
            phone: data.phone || '',
            source: 'Enquiry Form',
            lastContact: data.timestamp?.toDate?.().toLocaleDateString() || new Date().toLocaleDateString(),
            selected: false,
            sourceCollection: 'enquiries',
            sourceId: doc.id
          });
        }
      });

      // Fetch customers from projects
      const projectsQuery = query(collection(db, 'projects'));
      const projectsSnapshot = await getDocs(projectsQuery);

      projectsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.clientEmail) return;

        const email = data.clientEmail.toLowerCase();
        const existingCustomer = customerSet.get(email);

        if (existingCustomer) {
          customerSet.set(email, {
            ...existingCustomer,
            projects: [...(existingCustomer.projects || []), data.title],
            source: existingCustomer.source.includes('Project Client')
              ? existingCustomer.source
              : existingCustomer.source + ', Project Client',
          });
        } else {
          customerSet.set(email, {
            id: doc.id,
            name: data.client,
            email: email,
            phone: data.clientPhone || '',
            source: 'Project Client',
            lastContact: new Date().toLocaleDateString(),
            projects: [data.title],
            address: data.address,
            selected: false,
            sourceCollection: 'projects',
            sourceId: doc.id
          });
        }
      });

      setCustomers(Array.from(customerSet.values()));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Error loading customer database');
      setLoading(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`)) {
      try {
        // For project clients, we might not want to delete the project doc
        if (customer.sourceCollection === 'projects') {
          toast.warning('This customer is tied to an active project. Please delete or update the project directly.');
          return;
        }

        await deleteDoc(doc(db, customer.sourceCollection, customer.sourceId));
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
        toast.success('Customer deleted successfully');
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      const { sourceCollection, sourceId, name, phone, address } = editingCustomer;

      const updateData: any = {
        name,
        phone,
        address
      };

      // Handle different collection field names
      if (sourceCollection === 'projects') {
        updateData.client = name;
        updateData.clientPhone = phone;
        delete updateData.name;
        delete updateData.phone;
      }

      await updateDoc(doc(db, sourceCollection, sourceId), updateData);

      setCustomers(prev => prev.map(c =>
        c.id === editingCustomer.id ? editingCustomer : c
      ));
      setEditingCustomer(null);
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    }
  };

  const toggleCustomerSelection = (customer: Customer) => {
    setCustomers(prevCustomers =>
      prevCustomers.map(c =>
        c.id === customer.id
          ? { ...c, selected: !c.selected }
          : c
      )
    );
  };

  const toggleAllCustomers = () => {
    const customersWithEmail = filteredCustomers.filter(c => c.email && c.email.includes('@'));
    const allSelected = customersWithEmail.every(c => c.selected);

    setCustomers(prevCustomers =>
      prevCustomers.map(c => {
        const isMatched = filteredCustomers.some(fc => fc.id === c.id);
        if (!isMatched) return c;
        return {
          ...c,
          selected: c.email && c.email.includes('@') ? !allSelected : false
        };
      })
    );
  };

  const handleEmailCampaign = () => {
    const selectedCustomers = customers.filter(c =>
      c.selected && c.email && c.email.includes('@')
    );

    if (selectedCustomers.length === 0) {
      toast.warning('Please select at least one customer with a valid email address');
      return;
    }
    setShowEmailCampaign(true);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);

    if (filter === 'all') return matchesSearch;
    if (filter === 'registered') return matchesSearch && customer.source.includes('Registered Customer');
    if (filter === 'projects') return matchesSearch && (customer.projects?.length ?? 0) > 0;
    if (filter === 'enquiries') return matchesSearch && customer.source.includes('Enquiry');
    return matchesSearch;
  });

  return (
    <div className="p-8 space-y-8">
      <ToastContainer position="bottom-right" />

      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Customer Database</h2>
          <p className="text-gray-500 font-medium mt-1">Manage your leads and registered clients</p>
        </div>
        <button
          onClick={handleEmailCampaign}
          className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          Send Email Campaign
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
          />
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-6 pr-12 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 appearance-none shadow-inner min-w-[200px]"
          >
            <option value="all">All Customers</option>
            <option value="registered">Registered Customers</option>
            <option value="projects">Project Clients</option>
            <option value="enquiries">Enquiries</option>
          </select>
          <XMarkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none rotate-45" />
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5 text-left">
                    <input
                      type="checkbox"
                      onChange={toggleAllCustomers}
                      checked={filteredCustomers.length > 0 && filteredCustomers.every(c => c.selected)}
                      className="rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
                    />
                  </th>
                  <th className="px-8 py-5 text-left">Name</th>
                  <th className="px-8 py-5 text-left">Contact Info</th>
                  <th className="px-8 py-5 text-left">Source</th>
                  <th className="px-8 py-5 text-left">Projects</th>
                  <th className="px-8 py-5 text-left">Address</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id + index} className="group hover:bg-indigo-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <input
                        type="checkbox"
                        checked={customer.selected || false}
                        onChange={() => toggleCustomerSelection(customer)}
                        className="rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5"
                      />
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-gray-800">{customer.name}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-gray-700">{customer.email}</div>
                      <div className="text-xs font-medium text-gray-400 mt-1">{customer.phone}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className="w-fit px-3 py-1 bg-white border border-gray-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm">
                          {customer.source.split(',')[0]}
                        </span>
                        <span className="text-[10px] font-medium text-gray-400 ml-1">
                          Since {customer.lastContact}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {customer.projects ? (
                        <div className="flex flex-wrap gap-2">
                          {customer.projects.map((project, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-[10px] font-bold">
                              {project}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-gray-300 italic">No projects</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {customer.address ? (
                        <div className="text-xs font-medium text-gray-500 leading-relaxed">
                          {customer.address.street}, {customer.address.city}
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-gray-300 italic">No address recorded</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingCustomer(customer)}
                          className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCustomer && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-10 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-800 tracking-tight">Edit Customer</h3>
                </div>
                <button
                  onClick={() => setEditingCustomer(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Full Name</label>
                    <input
                      type="text"
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Phone Number</label>
                    <input
                      type="text"
                      value={editingCustomer.phone}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address Details</span>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={editingCustomer.address?.street || ''}
                      onChange={(e) => setEditingCustomer({
                        ...editingCustomer,
                        address: { ...editingCustomer.address!, street: e.target.value }
                      })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        value={editingCustomer.address?.city || ''}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address!, city: e.target.value }
                        })}
                        className="col-span-1 w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={editingCustomer.address?.state || ''}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address!, state: e.target.value }
                        })}
                        className="col-span-1 w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                      />
                      <input
                        type="text"
                        placeholder="PIN"
                        value={editingCustomer.address?.pincode || ''}
                        onChange={(e) => setEditingCustomer({
                          ...editingCustomer,
                          address: { ...editingCustomer.address!, pincode: e.target.value }
                        })}
                        className="col-span-1 w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="px-8 py-4 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showEmailCampaign && (
        <EmailCampaign
          customers={customers.filter(c => c.selected)}
          onClose={() => setShowEmailCampaign(false)}
        />
      )}
    </div>
  );
};

export default CustomerDatabase;
