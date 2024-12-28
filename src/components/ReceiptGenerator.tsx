import { useState } from 'react';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface ReceiptItem {
  description: string;
  amount: number;
}

const ReceiptGenerator = () => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([{ description: '', amount: 0 }]);
  const [receiptNumber, setReceiptNumber] = useState(`RC-${new Date().getTime()}`);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');

  const addItem = () => {
    setItems([...items, { description: '', amount: 0 }]);
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const loadQuotationData = async () => {
    if (!quotationNumber) return;

    try {
      const quotationsRef = collection(db, 'quotations');
      const q = query(quotationsRef, where('quotationNumber', '==', quotationNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const quotationData = querySnapshot.docs[0].data();
        setCustomerName(quotationData.customerName);
        setCustomerEmail(quotationData.customerEmail);
        
        // Convert quotation items to receipt items
        const receiptItems = quotationData.items.map((item: any) => ({
          description: item.description,
          amount: item.quantity * item.unitPrice
        }));
        setItems(receiptItems);
      } else {
        alert('Quotation not found');
      }
    } catch (error) {
      console.error('Error loading quotation:', error);
      alert('Error loading quotation data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const receiptData = {
        receiptNumber,
        quotationNumber: quotationNumber || null,
        customerName,
        customerEmail,
        items,
        total: calculateTotal(),
        paymentMethod,
        createdAt: new Date(),
        status: 'paid'
      };

      await addDoc(collection(db, 'receipts'), receiptData);
      alert('Receipt generated successfully!');
      
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setItems([{ description: '', amount: 0 }]);
      setReceiptNumber(`RC-${new Date().getTime()}`);
      setPaymentMethod('');
      setQuotationNumber('');
    } catch (error) {
      console.error('Error saving receipt:', error);
      alert('Error generating receipt. Please try again.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Generate Receipt</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Receipt Number</label>
            <input
              type="text"
              value={receiptNumber}
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quotation Number (Optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={quotationNumber}
                onChange={(e) => setQuotationNumber(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={loadQuotationData}
                className="mt-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Load
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select Payment Method</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Add Item
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value))}
                  min="0"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between font-bold text-lg">
          <span>Total Amount:</span>
          <span>₹{calculateTotal().toFixed(2)}</span>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Generate Receipt
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReceiptGenerator;
