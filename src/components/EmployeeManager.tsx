import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import EmployeeUpload from './EmployeeUpload';
import EmployeeEmailCampaign from './EmployeeEmailCampaign';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department?: string;
  joiningDate: string;
  salary: number;
  status: string;
  selected?: boolean;
}

const EmployeeManager: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEmailCampaign, setShowEmailCampaign] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      })) as Employee[];
      setEmployees(employeesList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Error loading employees');
      setLoading(false);
    }
  };

  const handleEdit = async (employee: Employee) => {
    setEditingEmployee(employee);
    setShowUploadModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteDoc(doc(db, 'employees', id));
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Error deleting employee');
      }
    }
  };

  const handleStatusChange = async (employee: Employee, newStatus: string) => {
    try {
      const employeeRef = doc(db, 'employees', employee.id);
      await updateDoc(employeeRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success('Employee status updated');
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error('Error updating status');
    }
  };

  const toggleEmployeeSelection = (employee: Employee) => {
    setEmployees(prevEmployees => 
      prevEmployees.map(e => 
        e.id === employee.id 
          ? { ...e, selected: !e.selected }
          : e
      )
    );
  };

  const toggleAllEmployees = () => {
    // Get all employees with valid emails
    const employeesWithEmail = employees.filter(e => e.email && e.email.includes('@'));
    
    // Check if all valid email employees are currently selected
    const allSelected = employeesWithEmail.every(e => e.selected);
    
    // Update selection state for all employees
    setEmployees(prevEmployees => 
      prevEmployees.map(e => ({
        ...e,
        // Only toggle selection if employee has a valid email
        selected: e.email && e.email.includes('@') ? !allSelected : false
      }))
    );
  };

  const handleEmailCampaign = () => {
    // Filter selected employees and ensure they have valid emails
    const selectedEmployees = employees.filter(e => 
      e.selected && e.email && e.email.includes('@')
    );

    if (selectedEmployees.length === 0) {
      toast.warning('Please select at least one employee with a valid email address');
      return;
    }
    setShowEmailCampaign(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const closeUploadModal = () => setShowUploadModal(false);
  const handleUploadSuccess = () => fetchEmployees();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Employee Management</h2>
        <div className="flex gap-2">
          <button
            onClick={handleEmailCampaign}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Send Email Campaign
          </button>
          <button
            onClick={() => {
              setEditingEmployee(null);
              setShowUploadModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Employee
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-md text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-700">Loading employees...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  <input
                    type="checkbox"
                    checked={employees.every(e => e.selected)}
                    onChange={toggleAllEmployees}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={employee.selected || false}
                      onChange={() => toggleEmployeeSelection(employee)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">{employee.name}</div>
                    <div className="text-sm text-gray-600">
                      Joined: {new Date(employee.joiningDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{employee.email}</div>
                    <div className="text-sm text-gray-600">{employee.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">{employee.position}</div>
                    <div className="text-sm text-gray-600">{employee.department}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700">₹{employee.salary.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={employee.status}
                      onChange={(e) => handleStatusChange(employee, e.target.value)}
                      className={`text-sm rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        employee.status === 'active'
                          ? 'bg-green-100 text-green-800 focus:ring-green-500'
                          : 'bg-red-100 text-red-800 focus:ring-red-500'
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md px-2 py-1"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUploadModal && (
        <EmployeeUpload
          onClose={closeUploadModal}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {showEmailCampaign && (
        <EmployeeEmailCampaign
          employees={employees.filter(e => e.selected && e.email && e.email.includes('@'))}
          onClose={() => setShowEmailCampaign(false)}
        />
      )}
    </div>
  );
};

export default EmployeeManager;
