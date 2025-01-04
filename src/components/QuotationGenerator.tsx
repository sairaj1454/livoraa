import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc, doc, setDoc, query, where, getDoc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import CustomerSearchPopup from './CustomerSearchPopup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Customer, QuotationItem, Quotation } from '../types';

interface ItemType {
  name: string;
  rate: number;
  isLumpsum: boolean;
}

interface QuotationData {
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

const QuotationGenerator = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
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

  const [customItems, setCustomItems] = useState<string[]>([
    'Box (Below Platform)',
    'Above Platform',
    'Frame',
    'Baskets',
    'Wardrobe',
    'Loft',
    'Dressing',
    'Cot',
    'Book shelf',
    'TV Unit',
    'Partition',
    'Crockery & Pooja room',
    'Wash Unit',
    'BF Counter',
    'Shoe rack',
    'Box'
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [editingItem, setEditingItem] = useState<{oldName: string, newName: string} | null>(null);

  const [itemTypes, setItemTypes] = useState<ItemType[]>([
    { name: 'Box', rate: 7500, isLumpsum: false },
    { name: 'Frame', rate: 35600, isLumpsum: false },
    { name: 'TV Unit', rate: 75600, isLumpsum: false },
    { name: 'Wardrobe', rate: 61600, isLumpsum: false },
    { name: 'Partition', rate: 48000, isLumpsum: false },
  ]);

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeRate, setNewTypeRate] = useState(0);
  const [newTypeIsLumpsum, setNewTypeIsLumpsum] = useState(false);
  const [editingType, setEditingType] = useState<ItemType | null>(null);

  const [newItemPrice, setNewItemPrice] = useState(0);

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

  const [isCustomerPopupOpen, setIsCustomerPopupOpen] = useState(false);

  const fetchLatestQuotation = async (customerId: string) => {
    try {
      const quotationsRef = collection(db, 'quotations');
      const q = query(
        quotationsRef,
        where('clientId', '==', customerId)
      );
      const querySnapshot = await getDocs(q);
      
      // Reset form data first
      setSiteCode('');
      setSiteAddress('');
      setClientName('');
      setVersion('V1'); // Default to V1
      setDate(new Date().toLocaleDateString('en-GB'));
      setItems([]);
      setFalseCeiling('0');
      setElectrical('0');
      setPainting('0');
      setFalseCeilingDesc('');
      setElectricalDesc('');
      setPaintingDesc('');
      
      if (querySnapshot.docs.length > 0) {
        // If quotation exists, use its data
        const latestDoc = querySnapshot.docs[0];
        const data = latestDoc.data() as Quotation;
        const latestQuotation = {
          ...data,
          id: latestDoc.id,
        };

        setSiteCode(latestQuotation.siteCode || '');
        setSiteAddress(latestQuotation.siteAddress || '');
        setClientName(latestQuotation.clientName || '');
        
        const currentVersion = latestQuotation.version || 'V1';
        const versionNumber = parseInt(currentVersion.substring(1)) + 1;
        setVersion(`V${versionNumber}`);
        
        setItems(latestQuotation.items || []);
        setFalseCeiling(latestQuotation.falseCeiling || '0');
        setElectrical(latestQuotation.electrical || '0');
        setPainting(latestQuotation.painting || '0');
        setFalseCeilingDesc(latestQuotation.falseCeilingDesc || '');
        setElectricalDesc(latestQuotation.electricalDesc || '');
        setPaintingDesc(latestQuotation.paintingDesc || '');

        toast.info('Loaded latest quotation details');
      } else {
        // If no quotation exists, fetch customer details from database
        const customerDoc = await getDoc(doc(db, 'customers', customerId));
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          setClientName(customerData.name || '');
          
          // Construct address from customer data
          const addressParts = [];
          if (customerData.address?.street?.trim()) addressParts.push(customerData.address.street);
          if (customerData.address?.city?.trim()) addressParts.push(customerData.address.city);
          if (customerData.address?.state?.trim()) addressParts.push(customerData.address.state);
          if (customerData.address?.pincode?.trim()) addressParts.push(customerData.address.pincode);
          
          setSiteAddress(addressParts.join(', '));
          setVersion('V1'); // Set to V1 for new quotation
          
          toast.info('Started new quotation with customer details');
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
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
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customerId);
      setClientName(customer.name || '');
      
      // Only include non-empty address components
      const addressParts = [];
      if (customer.address?.street?.trim()) addressParts.push(customer.address.street);
      if (customer.address?.city?.trim()) addressParts.push(customer.address.city);
      if (customer.address?.state?.trim()) addressParts.push(customer.address.state);
      if (customer.address?.pincode?.trim()) addressParts.push(customer.address.pincode);
      
      setSiteAddress(addressParts.join(', '));
      fetchLatestQuotation(customerId);
    }
  };

  const addCustomItem = () => {
    if (newItemName && !customItems.includes(newItemName)) {
      setCustomItems([...customItems, newItemName]);
      setNewItemName('');
    } else if (customItems.includes(newItemName)) {
      alert('Item already exists!');
    }
  };

  const startEditingItem = (itemName: string) => {
    setEditingItem({ oldName: itemName, newName: itemName });
  };

  const saveEditedItem = () => {
    if (editingItem) {
      if (customItems.includes(editingItem.newName) && editingItem.oldName !== editingItem.newName) {
        alert('Item name already exists!');
        return;
      }

      setCustomItems(customItems.map(item => 
        item === editingItem.oldName ? editingItem.newName : item
      ));

      // Update all existing items with this name
      const updatedItems = items.map(item => ({
        ...item,
        item: item.item === editingItem.oldName ? editingItem.newName : item.item
      }));
      setItems(updatedItems);

      setEditingItem(null);
    }
  };

  const deleteCustomItem = (itemName: string) => {
    if (window.confirm(`Are you sure you want to delete ${itemName}?`)) {
      setCustomItems(customItems.filter(item => item !== itemName));
      // Remove this item from any rooms using it
      setItems(items.filter(item => item.item !== itemName));
    }
  };

  const addItem = (room: string) => {
    const defaultType = itemTypes[0]?.name || '';
    const defaultRate = itemTypes[0]?.rate || 0;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      room,
      item: customItems[0],
      d1: 0,
      d2: 0,
      type: defaultType,
      area: 0,
      price: defaultRate,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (itemId: string, field: keyof QuotationItem, value: string | number) => {
    const newItems = items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item };
        if (field === 'item') {
          updatedItem.item = value as string;
        } else if (field === 'd1' || field === 'd2') {
          updatedItem[field] = value as number;
        } else if (field === 'type') {
          updatedItem.type = value as string;
          // Update price based on selected type
          const selectedType = itemTypes.find(type => type.name === value);
          if (selectedType) {
            updatedItem.price = selectedType.rate;
            if (selectedType.isLumpsum) {
              updatedItem.d1 = 1;
              updatedItem.d2 = 1;
              updatedItem.area = 1;
            }
          }
        } else if (field === 'price' || field === 'area') {
          updatedItem[field] = value as number;
        } else if (field === 'room') {
          updatedItem[field] = value as string;
        }

        // Calculate area and update price only for non-lumpsum items
        const selectedType = itemTypes.find(type => type.name === updatedItem.type);
        if (field === 'd1' || field === 'd2' || field === 'type') {
          if (!selectedType?.isLumpsum) {
            updatedItem.area = updatedItem.d1 * updatedItem.d2;
          }
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
    return items.reduce((sum, item) => sum + (item.price * item.area), 0);
  };

  const calculateTotal = (): number => {
    let total = calculateSubtotal();
    
    if (falseCeiling && parseInt(falseCeiling) > 0) total += parseInt(falseCeiling);
    if (electrical && parseInt(electrical) > 0) total += parseInt(electrical);
    if (painting && parseInt(painting) > 0) total += parseInt(painting);
    
    return total;
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

  const addItemType = () => {
    if (newTypeName && newTypeRate > 0) {
      setItemTypes([...itemTypes, { name: newTypeName, rate: newTypeRate, isLumpsum: newTypeIsLumpsum }]);
      setNewTypeName('');
      setNewTypeRate(0);
      setNewTypeIsLumpsum(false);
    }
  };

  const startEditingType = (type: ItemType) => {
    setEditingType({ ...type });
  };

  const saveEditedType = () => {
    if (editingType) {
      // Check if another type with the new name exists (except for the current type)
      const typeExists = itemTypes.some(type => 
        type.name === editingType.name && type.name !== editingType.name
      );

      if (typeExists) {
        alert('A type with this name already exists!');
        return;
      }

      setItemTypes(itemTypes.map(type => 
        type.name === editingType.name ? editingType : type
      ));

      // Update all items using this type
      setItems(items.map(item => {
        if (item.type === editingType.name) {
          return {
            ...item,
            price: editingType.rate
          };
        }
        return item;
      }));

      setEditingType(null);
    }
  };

  const deleteItemType = (typeName: string) => {
    if (window.confirm(`Are you sure you want to delete ${typeName}?`)) {
      setItemTypes(itemTypes.filter(type => type.name !== typeName));
    }
  };

  const hasAdditionalServices = () => {
    return (
      (falseCeiling !== '' && parseInt(falseCeiling) > 0) ||
      (electrical !== '' && parseInt(electrical) > 0) ||
      (painting !== '' && parseInt(painting) > 0)
    );
  };

  const getAdditionalServicesData = () => {
    const services = [];
    
    if (falseCeiling !== '' && parseInt(falseCeiling) > 0) {
      services.push(['False Ceiling', `₹${parseInt(falseCeiling).toLocaleString('en-IN')}`, falseCeilingDesc || '-']);
    }
    
    if (electrical !== '' && parseInt(electrical) > 0) {
      services.push(['Electrical', `₹${parseInt(electrical).toLocaleString('en-IN')}`, electricalDesc || '-']);
    }
    
    if (painting !== '' && parseInt(painting) > 0) {
      services.push(['Painting', `₹${parseInt(painting).toLocaleString('en-IN')}`, paintingDesc || '-']);
    }
    
    return services;
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
    doc.text('QUOTATION / ESTIMATION', 15, 55);
    
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
      roomTotals[room] = items.reduce((sum, item) => sum + (item.price * item.area), 0);
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
      const tableData = roomItems.map(item => {
        const selectedType = itemTypes.find(type => type.name === item.type);
        if (selectedType?.isLumpsum) {
          return [
            item.item,
            '-',
            '-',
            item.type,
            '-',
            item.price.toLocaleString('en-IN')
          ];
        }
        return [
          item.item,
          item.d1.toString(),
          item.d2.toString(),
          item.type,
          item.area.toFixed(2),
          (item.price * item.area).toLocaleString('en-IN')
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Item', 'D1', 'D2', 'Type', 'Area', 'Rate']],
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
          4: { halign: 'right' }, // Area column right-aligned
          5: { halign: 'right' }, // Rate column right-aligned
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
      const roomTotalText = `Room Total: ${roomTotals[room].toLocaleString('en-IN')}`;
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
    if (hasAdditionalServices()) {
      currentY += 10;
      
      // Additional Services Header
      doc.setFillColor(primaryColor);
      doc.rect(15, currentY, 180, 8, 'F');
      doc.setFontSize(11);
      doc.setTextColor('#FFFFFF');
      doc.text('Additional Services', 20, currentY + 5.5);
      currentY += 8;

      // Additional Services Table
      const additionalServicesData = getAdditionalServicesData();

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
      const additionalTotal = parseInt(falseCeiling) + parseInt(electrical) + parseInt(painting);
      doc.setFontSize(10);
      doc.setTextColor(primaryColor);
      doc.setFont('helvetica', 'bold');
      const additionalTotalText = `Additional Services Total: ${additionalTotal.toLocaleString('en-IN')}`;
      const textWidth = doc.getTextWidth(additionalTotalText);
      const pageWidth = doc.internal.pageSize.width;
      doc.text(additionalTotalText, (pageWidth - textWidth) / 2, currentY);
      currentY += 15;
    }

    // Grand total with emphasis
    const total = Object.values(roomTotals).reduce((sum, roomTotal) => sum + roomTotal, 0);
    const grandTotal = total + parseInt(falseCeiling) + parseInt(electrical) + parseInt(painting);
    
    doc.setFillColor(primaryColor);
    doc.rect(15, currentY, 180, 10, 'F');
    doc.setFontSize(12);
    doc.setTextColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total: ${grandTotal.toLocaleString('en-IN')}`, 20, currentY + 6);

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

  const clearAllFields = () => {
    setSelectedCustomer('');
    setSiteCode('');
    setSiteAddress('');
    setClientName('');
    setVersion('V1');
    setDate(new Date().toLocaleDateString('en-GB'));
    setItems([]);
    setFalseCeiling('0');
    setElectrical('0');
    setPainting('0');
    setFalseCeilingDesc('');
    setElectricalDesc('');
    setPaintingDesc('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const quotationData: QuotationData = {
        clientId: selectedCustomer,
        clientName,
        customerEmail: customers.find(c => c.id === selectedCustomer)?.email || '',
        siteCode,
        siteAddress,
        version,
        date,
        items,
        falseCeiling,
        electrical,
        painting,
        falseCeilingDesc,
        electricalDesc,
        paintingDesc,
        terms,
        total: calculateTotal(),
        timestamp: new Date()
      };

      const quotationsRef = collection(db, 'quotations');
      await addDoc(quotationsRef, quotationData);
      toast.success('Quotation saved successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      clearAllFields(); // Clear all fields after successful save
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error('Error saving quotation. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Quotation Generator</h1>
              <p className="mt-2 text-lg text-gray-600">Create professional quotations for your interior projects</p>
            </div>
            <img src="/images/portfolio/new.png" alt="Logo" className="h-16 sm:h-20 w-auto object-contain" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Client Information Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Client Information</h2>
              <p className="mt-1 text-sm text-gray-500">Enter the client and project details</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select Customer</label>
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
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Site Code</label>
                <input
                  type="text"
                  value={siteCode}
                  onChange={(e) => setSiteCode(e.target.value)}
                  required
                  className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                  placeholder="Enter site code"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="text"
                  value={date}
                  readOnly
                  className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50 shadow-sm sm:text-sm text-black"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Version</label>
                <input
                  type="text"
                  value={version}
                  readOnly
                  className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 bg-gray-50 shadow-sm sm:text-sm text-black"
                  placeholder="Version will be auto-generated"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                  placeholder="Enter client name"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Site Address</label>
                <textarea
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  required
                  rows={2}
                  className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                  placeholder="Enter complete site address"
                />
              </div>
            </div>
          </div>

          {/* Room Management */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Room Management</h2>
                  <p className="mt-1 text-sm text-gray-500">Add and manage rooms for your project</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 w-full sm:w-48 text-black"
                    placeholder="Enter room name"
                  />
                  <button
                    type="button"
                    onClick={addRoom}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ease-in-out w-full sm:w-auto"
                  >
                    Add Room
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div key={room} className="group bg-white rounded-lg border-2 border-gray-200 p-5 hover:border-indigo-500 hover:shadow-md transition-all duration-200">
                  {editingRoom?.oldName === room ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editingRoom.newName}
                        onChange={(e) => setEditingRoom({ ...editingRoom, newName: e.target.value })}
                        className="block w-full rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 text-black"
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={saveEditedRoom}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRoom(null)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{room}</h3>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                          {items.filter(item => item.room === room).length} items
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEditingRoom(room)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRoom(room)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
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

          {/* Custom Items Management */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Custom Items</h2>
                  <p className="mt-1 text-sm text-gray-500">Add and manage custom items for your quotations</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 w-full sm:w-64 text-black"
                    placeholder="Enter item name"
                  />
                  <button
                    type="button"
                    onClick={addCustomItem}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ease-in-out w-full sm:w-auto"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customItems.map((itemName) => (
                <div key={itemName} className="group bg-white rounded-lg border-2 border-gray-200 p-5 hover:border-indigo-500 hover:shadow-md transition-all duration-200">
                  {editingItem?.oldName === itemName ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editingItem.newName}
                        onChange={(e) => setEditingItem({ ...editingItem, newName: e.target.value })}
                        className="block w-full rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 text-black"
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={saveEditedItem}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItem(null)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{itemName}</h3>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEditingItem(itemName)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCustomItem(itemName)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
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

          {/* Item Types Management */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Item Types</h2>
                  <p className="mt-1 text-sm text-gray-500">Manage item types and their rates</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Type Name"
                    className="rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 w-full sm:w-48 text-black"
                  />
                  <input
                    type="number"
                    value={newTypeRate || ''}
                    onChange={(e) => setNewTypeRate(Number(e.target.value))}
                    placeholder="Rate"
                    className="rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 w-full sm:w-36 text-black"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTypeIsLumpsum}
                      onChange={(e) => setNewTypeIsLumpsum(e.target.checked)}
                      className="rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400"
                    />
                    <label>Lumpsum</label>
                  </div>
                  <button
                    type="button"
                    onClick={addItemType}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ease-in-out w-full sm:w-auto"
                  >
                    Add Type
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {itemTypes.map((type) => (
                <div key={type.name} className="group bg-white rounded-lg border-2 border-gray-200 p-5 hover:border-indigo-500 hover:shadow-md transition-all duration-200">
                  {editingType?.name === type.name ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editingType.name}
                          onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                          placeholder="Type Name"
                          className="block w-full rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 text-black"
                        />
                        <input
                          type="number"
                          value={editingType.rate}
                          onChange={(e) => setEditingType({ ...editingType, rate: Number(e.target.value) })}
                          placeholder="Rate"
                          className="block w-full rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 text-black"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingType.isLumpsum}
                            onChange={(e) => setEditingType({ ...editingType, isLumpsum: e.target.checked })}
                            className="rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400"
                          />
                          <label>Lumpsum</label>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={saveEditedType}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingType(null)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 mb-4">
                        <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
                        <p className="text-sm text-gray-500">₹{type.rate.toLocaleString('en-IN')}/area</p>
                        <p className="text-sm text-gray-500">{type.isLumpsum ? 'Lumpsum' : 'Rate per area'}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startEditingType(type)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItemType(type.name)}
                          className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
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
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Terms & Conditions</h2>
              <p className="mt-1 text-sm text-gray-500">Manage terms and conditions for your quotations</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 w-full text-black"
                  placeholder="Enter new term"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={addTerm}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ease-in-out w-full sm:w-auto"
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
                        className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                      />
                      <button
                        type="button"
                        onClick={updateTerm}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 ease-in-out"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTerm(null)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ease-in-out"
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
            <div key={room} className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">{room}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {items.filter(item => item.room === room).length} items configured
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <button
                    type="button"
                    onClick={() => addItem(room)}
                    className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ease-in-out w-full sm:w-auto"
                  >
                    Add Item
                  </button>
                </div>
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
                          className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                        >
                          {customItems.map(itemName => (
                            <option key={itemName} value={itemName}>{itemName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          value={item.type}
                          onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                          className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                        >
                          {itemTypes.map(type => (
                            <option key={type.name} value={type.name}>
                              {type.name} {type.isLumpsum ? '(₹' + type.rate.toLocaleString('en-IN') + ' Lumpsum)' : '(₹' + type.rate.toLocaleString('en-IN') + '/area)'}
                            </option>
                          ))}
                        </select>
                      </div>
                      {!itemTypes.find(type => type.name === item.type)?.isLumpsum && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">D1</label>
                            <input
                              type="number"
                              value={item.d1}
                              onChange={(e) => updateItem(item.id, 'd1', parseFloat(e.target.value))}
                              required
                              className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
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
                              className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Area</label>
                            <input
                              type="number"
                              value={item.area}
                              readOnly
                              className="mt-1 block w-full rounded-lg border-2 border-gray-300 px-4 py-2 bg-gray-50 shadow-sm sm:text-sm text-black"
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Rate</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">₹</span>
                          </div>
                          <input
                            type="text"
                            value={(item.price * item.area).toLocaleString('en-IN')}
                            readOnly
                            className="block w-full pl-7 pr-12 sm:text-sm border-2 border-gray-300 rounded-lg bg-gray-50 shadow-sm text-black"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Actions</label>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex items-center p-2 border border-transparent rounded-lg shadow-sm text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 ease-in-out"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Additional Services */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Additional Services</h2>
              <p className="mt-1 text-sm text-gray-500">Configure extra services and their descriptions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* False Ceiling */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-5 hover:border-indigo-500 hover:shadow-md transition-all duration-200">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">False Ceiling</h3>
                  <div className="relative rounded-md shadow-sm">
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
                      className="block w-full pl-7 pr-12 sm:text-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                      placeholder="Enter amount"
                    />
                  </div>
                  <textarea
                    value={falseCeilingDesc}
                    onChange={(e) => setFalseCeilingDesc(e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                    placeholder="Enter false ceiling details"
                  />
                </div>
              </div>

              {/* Electrical */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-5 hover:border-indigo-500 hover:shadow-md transition-all duration-200">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Electrical</h3>
                  <div className="relative rounded-md shadow-sm">
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
                      className="block w-full pl-7 pr-12 sm:text-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                      placeholder="Enter amount"
                    />
                  </div>
                  <textarea
                    value={electricalDesc}
                    onChange={(e) => setElectricalDesc(e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                    placeholder="Enter electrical work details"
                  />
                </div>
              </div>

              {/* Painting */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-5 hover:border-indigo-500 hover:shadow-md transition-all duration-200">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Painting</h3>
                  <div className="relative rounded-md shadow-sm">
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
                      className="block w-full pl-7 pr-12 sm:text-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                      placeholder="Enter amount"
                    />
                  </div>
                  <textarea
                    value={paintingDesc}
                    onChange={(e) => setPaintingDesc(e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-colors duration-200 ease-in-out hover:border-gray-400 text-black"
                    placeholder="Enter painting work details"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Total Amount</h3>
                <p className="mt-1 text-sm text-gray-500">Including all services and items</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">₹{calculateTotal().toLocaleString('en-IN')}</div>
                <p className="mt-1 text-sm text-gray-500">Subtotal: ₹{calculateSubtotal().toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-8">

          </div>
        </form>
        <CustomerSearchPopup
          customers={customers}
          isOpen={isCustomerPopupOpen}
          onClose={() => setIsCustomerPopupOpen(false)}
          onSelect={(customer) => handleCustomerSelect(customer.id)}
        />
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={generatePDF}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Generate PDF
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Save Quotation
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationGenerator;
