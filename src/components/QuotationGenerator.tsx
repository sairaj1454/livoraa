import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

interface QuotationItem {
  id: string;
  room: string;
  item: string;
  d1: number;
  d2: number;
  type: string;
  area: number;
  price: number;
  totalAmount: number;
}

// Utility functions for consistent price formatting
const formatPrice = (price: number): string => {
  return price.toLocaleString('en-IN');
};

const parsePrice = (price: string): number => {
  return parseInt(price.replace(/[^0-9]/g, '')) || 0;
};

const QuotationGenerator = () => {
  const [siteCode, setSiteCode] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [version, setVersion] = useState('V1');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [falseCeiling, setFalseCeiling] = useState<string>('0');
  const [electrical, setElectrical] = useState<string>('0');
  const [painting, setPainting] = useState<string>('0');
  const [falseCeilingDesc, setFalseCeilingDesc] = useState<string>('');
  const [electricalDesc, setElectricalDesc] = useState<string>('');
  const [paintingDesc, setPaintingDesc] = useState<string>('');

  const [rooms, setRooms] = useState<string[]>(['Kitchen', 'MBR', 'CBR', 'GBR', 'Hall', 'Dining', 'Utility']);
  const [newRoomName, setNewRoomName] = useState('');
  const [editingRoom, setEditingRoom] = useState<{oldName: string, newName: string} | null>(null);

  const [customItems, setCustomItems] = useState<{[key: string]: number}>({
    'Box (Below Platform)': 102465,
    'Above Platform': 50400,
    'Frame': 35600,
    'Baskets': 35000,
    'Wardrobe': 61600,
    'Loft': 11200,
    'Dressing': 14300,
    'Cot': 55000,
    'Book shelf': 10800,
    'TV Unit': 75600,
    'Partition': 48000,
    'Crockery & Pooja room': 95200,
    'Wash Unit': 13800,
    'BF Counter': 10000,
    'Shoe rack': 15000,
    'Box': 7500,
  });

  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(0);

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);

  const [terms, setTerms] = useState<string[]>([
    '50% advance payment required',
    'Prices are inclusive of GST',
    'Delivery timeline: 4-6 weeks',
    'Warranty: 1 year on manufacturing defects',
    'Price validity: 15 days'
  ]);
  const [newTerm, setNewTerm] = useState('');
  const [editingTerm, setEditingTerm] = useState<{index: number, text: string} | null>(null);

  const addCustomItem = () => {
    if (newItemName && newItemPrice > 0) {
      setCustomItems(prev => ({
        ...prev,
        [newItemName]: newItemPrice
      }));
      setNewItemName('');
      setNewItemPrice(0);
    }
  };

  const startEditing = (itemName: string, price: number) => {
    setEditingItem(itemName);
    setEditingPrice(price);
  };

  const saveEditedPrice = () => {
    if (editingItem) {
      setCustomItems(prev => ({
        ...prev,
        [editingItem]: editingPrice
      }));

      // Update all existing items with this name to use the new price
      const updatedItems = items.map(item => {
        if (item.item === editingItem) {
          return {
            ...item,
            price: editingPrice,
            totalAmount: item.area * editingPrice
          };
        }
        return item;
      });
      setItems(updatedItems);

      setEditingItem(null);
      setEditingPrice(0);
    }
  };

  const deleteCustomItem = (itemName: string) => {
    if (window.confirm(`Are you sure you want to delete ${itemName}?`)) {
      const { [itemName]: _, ...remainingItems } = customItems;
      setCustomItems(remainingItems);

      // Remove this item from any rooms using it
      const updatedItems = items.filter(item => item.item !== itemName);
      setItems(updatedItems);
    }
  };

  const addItem = (room: string) => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      room,
      item: Object.keys(customItems)[0],
      d1: 0,
      d2: 0,
      type: 'Box',
      area: 0,
      price: Object.values(customItems)[0],
      totalAmount: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (itemId: string, field: keyof QuotationItem, value: string | number) => {
    const newItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item };
        if (field === 'item') {
          updatedItem.item = value as string;
          updatedItem.price = customItems[value as string] || 0;
        } else if (field === 'd1' || field === 'd2') {
          updatedItem[field] = value as number;
        } else if (field === 'price' || field === 'totalAmount' || field === 'area') {
          updatedItem[field] = value as number;
        } else if (field === 'room' || field === 'type') {
          updatedItem[field] = value as string;
        }

        // Calculate area and total amount
        if (field === 'd1' || field === 'd2' || field === 'item') {
          updatedItem.area = updatedItem.d1 * updatedItem.d2;
          updatedItem.totalAmount = updatedItem.area * updatedItem.price;
        }
        return updatedItem;
      }
      return item;
    });
    setItems(newItems);
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const addRoom = () => {
    if (newRoomName && !rooms.includes(newRoomName)) {
      setRooms([...rooms, newRoomName]);
      setNewRoomName('');
    } else if (rooms.includes(newRoomName)) {
      alert('Room already exists!');
    }
  };

  const startEditingRoom = (roomName: string) => {
    setEditingRoom({ oldName: roomName, newName: roomName });
  };

  const saveEditedRoom = () => {
    if (editingRoom) {
      if (rooms.includes(editingRoom.newName) && editingRoom.oldName !== editingRoom.newName) {
        alert('Room name already exists!');
        return;
      }

      setRooms(rooms.map(room => 
        room === editingRoom.oldName ? editingRoom.newName : room
      ));

      // Update all items with this room name
      const updatedItems = items.map(item => ({
        ...item,
        room: item.room === editingRoom.oldName ? editingRoom.newName : item.room
      }));
      setItems(updatedItems);

      setEditingRoom(null);
    }
  };

  const deleteRoom = (roomName: string) => {
    if (window.confirm(`Are you sure you want to delete ${roomName}? All items in this room will be deleted.`)) {
      setRooms(rooms.filter(room => room !== roomName));
      // Remove all items from this room
      setItems(items.filter(item => item.room !== roomName));
    }
  };

  const calculateSubtotal = (): number => {
    return items.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + parsePrice(falseCeiling) + parsePrice(electrical) + parsePrice(painting);
  };

  const addTerm = () => {
    if (newTerm) {
      setTerms([...terms, newTerm]);
      setNewTerm('');
    }
  };

  const updateTerm = () => {
    if (editingTerm !== null) {
      const updatedTerms = [...terms];
      updatedTerms[editingTerm.index] = editingTerm.text;
      setTerms(updatedTerms);
      setEditingTerm(null);
    }
  };

  const deleteTerm = (index: number) => {
    if (window.confirm('Are you sure you want to delete this term?')) {
      setTerms(terms.filter((_, i) => i !== index));
    }
  };

  const moveTerm = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index > 0) || 
      (direction === 'down' && index < terms.length - 1)
    ) {
      const newTerms = [...terms];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [newTerms[index], newTerms[newIndex]] = [newTerms[newIndex], newTerms[index]];
      setTerms(newTerms);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Set theme colors
    const primaryColor = '#4A2D1D';
    const secondaryColor = '#8B4513';
    const accentColor = '#C4A484';
    const bgColor = '#FFF8DC';
    
    // Add company logo - adjusted position
    doc.addImage('/images/portfolio/new.png', 'PNG', 15, 20, 25, 25);
    
    // Company name with enhanced styling - adjusted position
    doc.setFontSize(28);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('VIRTUOUS INTERIORS', 45, 35);
    
    // Decorative line - adjusted position
    doc.setDrawColor(accentColor);
    doc.setLineWidth(0.5);
    doc.line(15, 45, 195, 45);
    
    // Header info with improved layout
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', 15, 55);
    
    // Client details in a professional layout with two columns
    doc.setFillColor(bgColor);
    doc.rect(15, 60, 180, 35, 'F');
    
    // Left column
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('Date:', 20, 70);
    doc.text('Client:', 20, 77);
    doc.text('Site Code:', 20, 84);
    doc.text('Version:', 20, 91);
    
    // Right column values
    doc.setFont('helvetica', 'normal');
    doc.text(date, 50, 70);
    doc.text(clientName, 50, 77);
    doc.text(siteCode, 50, 84);
    doc.text(version, 50, 91);
    
    // Site Address in a separate box below with text wrapping
    doc.setFillColor(bgColor);
    doc.rect(15, 100, 180, 25, 'F');  // Increased height for address box
    doc.setFont('helvetica', 'bold');
    doc.text('Site Address:', 20, 108);
    doc.setFont('helvetica', 'normal');
    
    // Handle long addresses with text wrapping
    const maxWidth = 130; // Maximum width for the address text
    const splitAddress = doc.splitTextToSize(siteAddress, maxWidth);
    doc.text(splitAddress, 60, 108);
    
    let currentY = 130;  // Increased starting position for the content below

    // Group items by room and create tables for each room
    const itemsByRoom = items.reduce((acc, item) => {
      if (!acc[item.room]) {
        acc[item.room] = [];
      }
      acc[item.room].push(item);
      return acc;
    }, {} as { [key: string]: QuotationItem[] });

    // Calculate room totals
    const roomTotals: { [key: string]: number } = {};
    Object.entries(itemsByRoom).forEach(([room, items]) => {
      roomTotals[room] = items.reduce((sum, item) => sum + item.totalAmount, 0);
    });

    // Create tables room by room
    Object.entries(itemsByRoom).forEach(([room, roomItems], index) => {
      // Room header
      doc.setFillColor(primaryColor);
      doc.rect(15, currentY, 180, 8, 'F');
      doc.setFontSize(11);
      doc.setTextColor('#FFFFFF');
      doc.text(`${room}`, 20, currentY + 5.5);
      currentY += 8;

      // Room items table
      const tableData = roomItems.map(item => [
        item.item,
        item.d1.toString(),
        item.d2.toString(),
        item.type,
        item.area.toFixed(2),
        formatPrice(item.price),
        formatPrice(item.totalAmount)
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Item', 'D1', 'D2', 'Type', 'Area', 'Price', 'Total']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: accentColor,
          lineWidth: 0.1,
          halign: 'left', // Default alignment
        },
        columnStyles: {
          5: { halign: 'right' }, // Price column right-aligned
          6: { halign: 'right' }, // Total column right-aligned
        },
        headStyles: {
          fillColor: secondaryColor,
          textColor: '#FFFFFF',
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: bgColor,
        },
        margin: { left: 15, right: 15 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 5;

      // Room subtotal - centered
      doc.setFontSize(10);
      doc.setTextColor(primaryColor);
      doc.setFont('helvetica', 'bold');
      const roomTotalText = `Room Total: ${formatPrice(roomTotals[room])}`;
      const textWidth = doc.getTextWidth(roomTotalText);
      const pageWidth = doc.internal.pageSize.width;
      doc.text(roomTotalText, (pageWidth - textWidth) / 2, currentY);
      currentY += 10;

      // Add new page if needed
      if (currentY > doc.internal.pageSize.height - 60) {
        doc.addPage();
        currentY = 20;
      }
    });

    // Additional Services Section
    currentY += 10;
    
    // Additional Services Header
    doc.setFillColor(primaryColor);
    doc.rect(15, currentY, 180, 8, 'F');
    doc.setFontSize(11);
    doc.setTextColor('#FFFFFF');
    doc.text('Additional Services', 20, currentY + 5.5);
    currentY += 8;

    // Additional Services Table
    const additionalServicesData = [
      ['False Ceiling', formatPrice(parsePrice(falseCeiling)), falseCeilingDesc || ''],
      ['Electrical', formatPrice(parsePrice(electrical)), electricalDesc || ''],
      ['Painting', formatPrice(parsePrice(painting)), paintingDesc || '']
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Service', 'Amount', 'Description']],
      body: additionalServicesData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: accentColor,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 'auto' }
      },
      headStyles: {
        fillColor: secondaryColor,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: bgColor,
      },
      margin: { left: 15, right: 15 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Additional Services Total
    const additionalTotal = parsePrice(falseCeiling) + parsePrice(electrical) + parsePrice(painting);
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    const additionalTotalText = `Additional Services Total: ${formatPrice(additionalTotal)}`;
    const textWidth = doc.getTextWidth(additionalTotalText);
    const pageWidth = doc.internal.pageSize.width;
    doc.text(additionalTotalText, (pageWidth - textWidth) / 2, currentY);
    currentY += 15;

    // Grand total with emphasis
    const total = Object.values(roomTotals).reduce((sum, roomTotal) => sum + roomTotal, 0);
    const grandTotal = total + parsePrice(falseCeiling) + parsePrice(electrical) + parsePrice(painting);
    
    doc.setFillColor(primaryColor);
    doc.rect(15, currentY, 180, 10, 'F');
    doc.setFontSize(12);
    doc.setTextColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: ${formatPrice(grandTotal)}`, 20, currentY + 6);

    // Terms and conditions section
    currentY += 20;
    if (currentY > doc.internal.pageSize.height - 80) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(bgColor);
    doc.rect(15, currentY, 180, 50, 'F');
    doc.setFontSize(11);
    doc.setTextColor(primaryColor);
    doc.text('Terms & Conditions:', 20, currentY + 7);
    
    doc.setFontSize(9);
    terms.forEach((term, index) => {
      doc.text(`• ${term}`, 25, currentY + 15 + (index * 6));
    });

    // Professional footer
    const footerY = doc.internal.pageSize.height - 15;
    doc.setDrawColor(accentColor);
    doc.setLineWidth(0.5);
    doc.line(15, footerY - 5, 195, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor);
    doc.text('Virtuous Interiors', 15, footerY);
    doc.text('Phone: +91-XXXXXXXXXX', doc.internal.pageSize.width / 2, footerY, { align: 'center' });
    doc.text('Email: contact@virtuousinteriors.com', 195, footerY, { align: 'right' });
    
    doc.save(`Quotation_${clientName}_${version}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    generatePDF();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-2 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center sm:text-left">Quotation Generator</h1>
              <p className="mt-1 text-sm text-gray-500 text-center sm:text-left">Create professional quotations for your interior projects</p>
            </div>
            <img src="/images/portfolio/new.png" alt="Logo" className="h-12 sm:h-16 w-auto" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
          {/* Client Information Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Client Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Site Code</label>
                <input
                  type="text"
                  value={siteCode}
                  onChange={(e) => setSiteCode(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-black px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                  placeholder="Enter site code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="text"
                  value={date}
                  readOnly
                  className="mt-1 block w-full rounded-md border-2 border-black bg-gray-50 shadow-sm sm:text-sm text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="mt-1 block w-full rounded-md border-2 border-black px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                  placeholder="Enter version"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-black px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                  placeholder="Enter client name"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700">Site Address</label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-2 border-black px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                  placeholder="Enter complete site address"
                />
              </div>
            </div>
          </div>

          {/* Room Management */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Room Management</h2>
                <p className="mt-1 text-sm text-gray-500">Add and manage rooms for your project</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black w-full sm:w-auto"
                  placeholder="Enter room name"
                />
                <button
                  type="button"
                  onClick={addRoom}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  Add Room
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {rooms.map((room) => (
                <div key={room} className="relative group bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:border-indigo-500 transition-colors duration-150">
                  {editingRoom?.oldName === room ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingRoom.newName}
                        onChange={(e) => setEditingRoom({ ...editingRoom, newName: e.target.value })}
                        className="block w-full rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-black"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={saveEditedRoom}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRoom(null)}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg sm:text-xl font-medium text-gray-900">{room}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {items.filter(item => item.room === room).length} items
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => startEditingRoom(room)}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRoom(room)}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Item Management */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Custom Items</h2>
                <p className="mt-1 text-sm text-gray-500">Manage your catalog of items and their prices</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1 rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black w-full"
                    placeholder="Item name"
                  />
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseFloat(e.target.value))}
                    className="flex-1 rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black w-full"
                    placeholder="Price"
                  />
                </div>
                <button
                  type="button"
                  onClick={addCustomItem}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  Add Item
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Object.entries(customItems).map(([itemName, price]) => (
                <div key={itemName} className="relative group bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:border-indigo-500 transition-colors duration-150">
                  {editingItem === itemName ? (
                    <div className="space-y-3">
                      <div className="font-medium text-gray-900">{itemName}</div>
                      <input
                        type="number"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(parseFloat(e.target.value))}
                        className="block w-full rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={saveEditedPrice}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem(null)}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg sm:text-xl font-medium text-gray-900">{itemName}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ₹{formatPrice(price)}/area
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => startEditing(itemName, price)}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Edit Price
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCustomItem(itemName)}
                          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Terms & Conditions</h2>
                <p className="mt-1 text-sm text-gray-500">Manage terms and conditions for your quotations</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                  placeholder="Enter new term"
                />
                <button
                  type="button"
                  onClick={addTerm}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  Add Term
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {terms.map((term, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-50 p-4 rounded-lg">
                  {editingTerm?.index === index ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editingTerm.text}
                        onChange={(e) => setEditingTerm({ ...editingTerm, text: e.target.value })}
                        className="flex-1 rounded-md border-2 border-black focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                      />
                      <button
                        type="button"
                        onClick={updateTerm}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTerm(null)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-900">{`${index + 1}. ${term}`}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveTerm(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTerm(index, 'down')}
                          disabled={index === terms.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTerm({ index, text: term })}
                          className="p-1 text-indigo-600 hover:text-indigo-900"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTerm(index)}
                          className="p-1 text-red-600 hover:text-red-900"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Room-wise Items */}
          {rooms.map((room) => (
            <div key={room} className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4 sm:gap-0">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{room}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {items.filter(item => item.room === room).length} items configured
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem(room)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
                >
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.filter(item => item.room === room).map((item) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Item</label>
                        <select
                          value={item.item}
                          onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                          className="mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                        >
                          {Object.keys(customItems).map(itemName => (
                            <option key={itemName} value={itemName}>{itemName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">D1</label>
                        <input
                          type="number"
                          value={item.d1}
                          onChange={(e) => updateItem(item.id, 'd1', parseFloat(e.target.value))}
                          required
                          className="mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">D2</label>
                        <input
                          type="number"
                          value={item.d2}
                          onChange={(e) => updateItem(item.id, 'd2', parseFloat(e.target.value))}
                          required
                          className="mt-1 block w-full rounded-md border-2 border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <input
                          type="text"
                          value={item.type}
                          readOnly
                          className="mt-1 block w-full rounded-md border-2 border-black bg-gray-50 shadow-sm sm:text-sm text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Area</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="number"
                            value={item.area}
                            readOnly
                            className="block w-full rounded-md border-2 border-black bg-gray-50 pr-12 sm:text-sm text-black"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">m²</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="number"
                            value={item.price}
                            readOnly
                            className="block w-full rounded-md border-2 border-black pl-7 bg-gray-50 sm:text-sm text-black"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total</label>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="relative flex-1 rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                              type="number"
                              value={item.totalAmount}
                              readOnly
                              className="block w-full rounded-md border-2 border-black pl-7 bg-gray-50 sm:text-sm text-black"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="inline-flex items-center p-2 border border-transparent rounded-md text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Additional Services */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mt-8">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Additional Services</h2>
              <p className="mt-1 text-sm text-gray-500">Configure extra services and their descriptions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* False Ceiling */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">False Ceiling</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      value={falseCeiling}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFalseCeiling(value);
                      }}
                      className="block w-full pl-7 pr-12 sm:text-sm border-2 border-black rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={falseCeilingDesc}
                    onChange={(e) => setFalseCeilingDesc(e.target.value)}
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-black rounded-md text-black"
                    placeholder="Enter false ceiling details"
                  />
                </div>
              </div>

              {/* Electrical */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Electrical</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      value={electrical}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setElectrical(value);
                      }}
                      className="block w-full pl-7 pr-12 sm:text-sm border-2 border-black rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={electricalDesc}
                    onChange={(e) => setElectricalDesc(e.target.value)}
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-black rounded-md text-black"
                    placeholder="Enter electrical work details"
                  />
                </div>
              </div>

              {/* Painting */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Painting</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      value={painting}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setPainting(value);
                      }}
                      className="block w-full pl-7 pr-12 sm:text-sm border-2 border-black rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-black"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={paintingDesc}
                    onChange={(e) => setPaintingDesc(e.target.value)}
                    rows={3}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-2 border-black rounded-md text-black"
                    placeholder="Enter painting work details"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mt-8">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900">Total Amount</h3>
                <p className="text-sm text-gray-500">Including all services and items</p>
              </div>
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-bold text-gray-900">
                  ₹{formatPrice(calculateTotal())}
                </div>
                <p className="text-sm text-gray-500">Total Amount</p>
              </div>
            </div>
          </div>

          {/* Generate PDF Button */}
          <div className="flex justify-end mt-4 sm:mt-8">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base sm:text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              Generate Quotation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuotationGenerator;
