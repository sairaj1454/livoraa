import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import EmailCampaign from './EmailCampaign';

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
}

const CustomerDatabase: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showEmailCampaign, setShowEmailCampaign] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
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
          });
        }
      });

      // Fetch customers from projects
      const projectsQuery = query(collection(db, 'projects'));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      projectsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.clientEmail) return; // Skip if no email
        
        const email = data.clientEmail.toLowerCase();
        const existingCustomer = customerSet.get(email);
        
        if (existingCustomer) {
          // Update existing customer with project info
          customerSet.set(email, {
            ...existingCustomer,
            projects: [...(existingCustomer.projects || []), data.title],
            source: existingCustomer.source.includes('Project Client') 
              ? existingCustomer.source 
              : existingCustomer.source + ', Project Client',
          });
        } else {
          // Add new customer from project
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
    // Get all customers with valid emails
    const customersWithEmail = customers.filter(c => c.email && c.email.includes('@'));
    
    // Check if all valid email customers are currently selected
    const allSelected = customersWithEmail.every(c => c.selected);
    
    // Update selection state for all customers
    setCustomers(prevCustomers => 
      prevCustomers.map(c => ({
        ...c,
        // Only toggle selection if customer has a valid email
        selected: c.email && c.email.includes('@') ? !allSelected : false
      }))
    );
  };

  const handleEmailCampaign = () => {
    // Filter selected customers and ensure they have valid emails
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
    <div className="p-6">
      <ToastContainer position="bottom-right" />
      
      {/* Header and Search */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Customer Database</h2>
          <button
            onClick={handleEmailCampaign}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send Email Campaign
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-auto p-3 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Customers</option>
              <option value="registered">Registered Customers</option>
              <option value="projects">Project Clients</option>
              <option value="enquiries">Enquiries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="text-center py-8 text-gray-700">Loading customers...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={toggleAllCustomers}
                    checked={customers.length > 0 && customers.every(c => c.selected)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Projects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer, index) => (
                <tr key={customer.id + index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={customer.selected || false}
                      onChange={() => toggleCustomerSelection(customer)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-800">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{customer.email}</div>
                    <div className="text-sm text-gray-600">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{customer.source}</div>
                    <div className="text-sm text-gray-600">Last Contact: {customer.lastContact}</div>
                  </td>
                  <td className="px-6 py-4">
                    {customer.projects ? (
                      <ul className="text-sm text-gray-700">
                        {customer.projects.map((project, idx) => (
                          <li key={idx} className="mb-1">{project}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-gray-500">No projects</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {customer.address ? (
                      <div className="text-sm text-gray-700">
                        <div>{customer.address.street}</div>
                        <div>{customer.address.city}, {customer.address.state}</div>
                        <div>{customer.address.pincode}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No address</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
