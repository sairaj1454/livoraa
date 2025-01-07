import React, { useState, useEffect, useRef } from 'react';
import { ProjectWorker } from '../types';

interface EmployeeSearchPopupProps {
  employees: ProjectWorker[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (employee: ProjectWorker) => void;
}

const ITEMS_PER_PAGE = 5;

const EmployeeSearchPopup: React.FC<EmployeeSearchPopupProps> = ({
  employees,
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<ProjectWorker[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilteredEmployees(
      employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchTerm, employees]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="space-y-2">
          {currentEmployees.map((employee) => (
            <div
              key={employee.id}
              onClick={() => {
                onSelect(employee);
                onClose();
              }}
              className="p-3 border rounded hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-semibold">{employee.name}</div>
              <div className="text-sm text-gray-600">
                <div>Position: {employee.position}</div>
                {employee.department && <div>Department: {employee.department}</div>}
                <div>Contact: {employee.contactNumber}</div>
              </div>
            </div>
          ))}
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center text-gray-500 my-4">No employees found</div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EmployeeSearchPopup;
