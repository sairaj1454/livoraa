import React, { useState, useEffect } from 'react';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

interface QuotationItem {
  id: string;
  room: string;
  item: string;
  d1: number;
  d2: number;
  type: string;
  area: number;
  price: number;
}

interface Quotation {
  id: string;
  clientId: string;
  clientName: string;
  customerEmail: string;
  siteCode: string;
  siteAddress: string;
  version: string;
  date: string;
  items: QuotationItem[];
  falseCeiling: string;
  electrical: string;
  painting: string;
  falseCeilingDesc: string;
  electricalDesc: string;
  paintingDesc: string;
  terms: string[];
  total: number;
  timestamp: Date;
}

const CustomerQuotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const quotationsRef = collection(db, 'quotations');
      const quotationsQuery = query(
        quotationsRef,
        where('customerEmail', '==', user.email)
      );
      
      const quotationsSnapshot = await getDocs(quotationsQuery);
      const quotationsList: Quotation[] = [];
      
      quotationsSnapshot.forEach((doc) => {
        const data = doc.data();
        quotationsList.push({
          id: doc.id,
          clientId: data.clientId || '',
          clientName: data.clientName || '',
          customerEmail: data.customerEmail || '',
          siteCode: data.siteCode || '',
          siteAddress: data.siteAddress || '',
          version: data.version || '',
          date: data.date || '',
          items: data.items || [],
          falseCeiling: data.falseCeiling || '',
          electrical: data.electrical || '',
          painting: data.painting || '',
          falseCeilingDesc: data.falseCeilingDesc || '',
          electricalDesc: data.electricalDesc || '',
          paintingDesc: data.paintingDesc || '',
          terms: data.terms || [],
          total: data.total || 0,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });

      setQuotations(quotationsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to load quotations');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-gray-900">My Quotations</h2>
      {quotations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No quotations found</p>
        </div>
      ) : (
        <>
          {selectedQuotation ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-gray-900">
                  Quotation Details - {selectedQuotation.siteCode}
                </h3>
                <button
                  onClick={() => setSelectedQuotation(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Back to List
                </button>
              </div>

              <div className="space-y-6">
                {/* Client Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Client Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Client Name:</span> {selectedQuotation.clientName}
                    </div>
                    <div>
                      <span className="font-medium">Site Code:</span> {selectedQuotation.siteCode}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Site Address:</span> {selectedQuotation.siteAddress}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span> {selectedQuotation.date}
                    </div>
                    <div>
                      <span className="font-medium">Version:</span> {selectedQuotation.version}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Items</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dimensions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedQuotation.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.room}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.d1} x {item.d2}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.area}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₹{(item.price * item.area).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Services */}
                {(selectedQuotation.falseCeiling !== '0' || 
                  selectedQuotation.electrical !== '0' || 
                  selectedQuotation.painting !== '0') && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Additional Services</h4>
                    <div className="space-y-4">
                      {selectedQuotation.falseCeiling !== '0' && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">False Ceiling</h5>
                              <p className="text-sm text-gray-600">{selectedQuotation.falseCeilingDesc}</p>
                            </div>
                            <div className="text-lg font-medium">₹{parseInt(selectedQuotation.falseCeiling).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      )}
                      {selectedQuotation.electrical !== '0' && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">Electrical</h5>
                              <p className="text-sm text-gray-600">{selectedQuotation.electricalDesc}</p>
                            </div>
                            <div className="text-lg font-medium">₹{parseInt(selectedQuotation.electrical).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      )}
                      {selectedQuotation.painting !== '0' && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">Painting</h5>
                              <p className="text-sm text-gray-600">{selectedQuotation.paintingDesc}</p>
                            </div>
                            <div className="text-lg font-medium">₹{parseInt(selectedQuotation.painting).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Terms & Conditions</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                    {selectedQuotation.terms.map((term, index) => (
                      <li key={index}>{term}</li>
                    ))}
                  </ul>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-medium">
                    <span>Total Amount</span>
                    <span>₹{selectedQuotation.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotations.map((quotation) => (
                <div
                  key={quotation.id}
                  className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedQuotation(quotation)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {quotation.siteCode}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(quotation.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Site:</span> {quotation.siteAddress.substring(0, 50)}...
                      </div>
                      <div>
                        <span className="font-medium">Items:</span> {quotation.items.length}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> ₹{quotation.total.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="mt-4 text-right">
                      <span className="text-indigo-600 text-sm font-medium hover:text-indigo-700">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerQuotations;
