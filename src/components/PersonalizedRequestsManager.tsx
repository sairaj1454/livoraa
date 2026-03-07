import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, Timestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { TrashIcon, CheckCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

interface PersonalizedRequest {
    id: string;
    name: string;
    phone: string;
    floorPlan: string;
    purpose: string;
    requirements: string[];
    location: string;
    budget: string;
    status: string;
    timestamp: Timestamp;
}

const PersonalizedRequestsManager = () => {
    const [requests, setRequests] = useState<PersonalizedRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const requestsRef = collection(db, 'personalized_enquiries');
        const q = query(requestsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsList: PersonalizedRequest[] = [];
            snapshot.forEach((doc) => {
                requestsList.push({ id: doc.id, ...doc.data() } as PersonalizedRequest);
            });
            setRequests(requestsList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching requests:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this request?')) {
            try {
                await deleteDoc(doc(db, 'personalized_enquiries', id));
                toast.success('Request deleted');
            } catch (error) {
                console.error("Error deleting request:", error);
                toast.error('Failed to delete request');
            }
        }
    };

    const handleStatusUpdate = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            await updateDoc(doc(db, 'personalized_enquiries', id), {
                status: newStatus
            });
            toast.success(`Marked as ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error('Failed to update status');
        }
    };

    const filteredRequests = requests.filter(req =>
        req.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.phone.includes(searchTerm) ||
        req.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Personalized Design Requests</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="bg-indigo-50 px-4 py-2 rounded-lg">
                        <span className="text-indigo-700 font-semibold">Total Requests: {filteredRequests.length}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Requirements</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Budget & Location</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRequests.map((doc) => (
                                <tr key={doc.id} className={`hover:bg-gray-50 transition-colors ${doc.status === 'completed' ? 'opacity-60' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{doc.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600 font-mono">{doc.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-bold">{doc.floorPlan}</div>
                                        <div className="text-xs text-gray-500">{doc.purpose}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {doc.requirements?.map((req, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-[10px] font-medium rounded-full text-gray-600">
                                                    {req}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 font-bold">{doc.budget}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{doc.location}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs text-gray-500">
                                            {doc.timestamp?.toDate().toLocaleString('en-IN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => handleStatusUpdate(doc.id, doc.status)}
                                                className={`transition-colors ${doc.status === 'completed' ? 'text-green-600' : 'text-gray-400 hvr:text-green-600'}`}
                                                title={doc.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                                            >
                                                <CheckCircleIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors"
                                                title="Delete Request"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredRequests.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No design requests found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalizedRequestsManager;
