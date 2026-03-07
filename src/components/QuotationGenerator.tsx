import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import {
  collection, getDocs, addDoc, doc, deleteDoc, updateDoc,
  query, where, getDoc, Timestamp
} from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import CustomerSearchPopup from './CustomerSearchPopup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Customer, QuotationItem } from '../types';
import {
  PlusIcon, TrashIcon, PencilSquareIcon,
  CheckIcon, DocumentTextIcon, UserIcon,
  ChevronUpIcon, ChevronDownIcon, EnvelopeIcon
} from '@heroicons/react/24/outline';
import { createNotification } from '../utils/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemType {
  id?: string;
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
  services: { type: string; price: number; details: string }[];
  terms: string[];
  total: number;
  quotationNo: string;
  validTill: string;
  timestamp: Timestamp;
}

// ─── Reusable Section wrapper ──────────────────────────────────────────────────

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const Section = ({ title, subtitle, children, action }: SectionProps) => (
  <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-10 pt-10 pb-6 border-b border-gray-50">
      <div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm font-medium text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-3">{action}</div>}
    </div>
    <div className="px-10 py-8">{children}</div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const QuotationGenerator = () => {
  const inputCls = "w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner outline-none";
  const labelCls = "text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2";

  // ── Client info ──
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isCustomerPopupOpen, setIsCustomerPopupOpen] = useState(false);
  const [siteCode, setSiteCode] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [version, setVersion] = useState('V1');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [validTill, setValidTill] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [quotationNo, setQuotationNo] = useState('A00001');

  // ── Rooms ──
  const [rooms, setRooms] = useState(['Kitchen', 'MBR', 'CBR', 'GBR', 'Hall', 'Dining', 'Utility']);
  const [newRoomName, setNewRoomName] = useState('');
  const [editingRoom, setEditingRoom] = useState<{ oldName: string; newName: string } | null>(null);

  // ── Items ──
  const [items, setItems] = useState<QuotationItem[]>([]);

  // ── Saved quotation tracking ──
  const [savedQuotationId, setSavedQuotationId] = useState<string | null>(null);
  const [isSentToClient, setIsSentToClient] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ── Item types (from Firestore) ──
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeRate, setNewTypeRate] = useState<number | ''>('');
  const [newTypeIsLumpsum, setNewTypeIsLumpsum] = useState(false);
  const [editingType, setEditingType] = useState<ItemType | null>(null);

  // ── Services ──
  const DEFAULT_SERVICES = [
    { type: 'False Ceiling', price: 0, details: '' },
    { type: 'Electrical', price: 0, details: '' },
    { type: 'Painting', price: 0, details: '' },
  ];
  const [services, setServices] = useState(DEFAULT_SERVICES);

  // ── Tax ──
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [masterTerms, setMasterTerms] = useState<string[]>([]);
  const [terms, setTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState('');
  const [editingTerm, setEditingTerm] = useState<{ index: number; text: string } | null>(null);

  // ─── Fetch data ────────────────────────────────────────────────────────────
  const [itemSearch, setItemSearch] = useState('');
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const snap = await getDocs(collection(db, 'customers'));
        setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
      } catch { toast.error('Error loading customers'); }
    };

    const fetchItemTypes = async () => {
      try {
        const snap = await getDocs(collection(db, 'itemTypes'));
        setItemTypes(snap.docs.map(d => ({ id: d.id, ...d.data() } as ItemType)));
      } catch { toast.error('Error loading item types'); }
    };

    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCompanySettings(data.companyInfo);
          if (data.quotationTerms) {
            setMasterTerms(data.quotationTerms);
            // Also set as initial terms if none exist
            setTerms(prev => prev.length === 0 ? data.quotationTerms : prev);
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchCustomers();
    fetchItemTypes();
    fetchNextQuotationNo();
    fetchSettings();
  }, []);

  const fetchNextQuotationNo = async () => {
    try {
      const snap = await getDocs(collection(db, 'quotations'));
      let maxNum = 0;
      snap.forEach(d => {
        const qNo = d.data().quotationNo;
        if (qNo && qNo.startsWith('A')) {
          const num = parseInt(qNo.substring(1));
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      setQuotationNo(`A${String(maxNum + 1).padStart(5, '0')} `);
    } catch (err) {
      console.error('Error fetching next quotation no:', err);
    }
  };

  // ─── Customer ─────────────────────────────────────────────────────────────

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    setSelectedCustomer(customerId);
    setClientName(customer.name || '');
    const parts: string[] = [];
    if (customer.address?.street?.trim()) parts.push(customer.address.street);
    if (customer.address?.city?.trim()) parts.push(customer.address.city);
    if (customer.address?.state?.trim()) parts.push(customer.address.state);
    if (customer.address?.pincode?.trim()) parts.push(customer.address.pincode);
    setSiteAddress(parts.join(', '));
    setServices([...DEFAULT_SERVICES]);
    fetchLatestQuotation(customerId);
  };

  const fetchLatestQuotation = async (customerId: string) => {
    try {
      setSiteCode(''); setVersion('V1'); setItems([]); setTerms([...masterTerms]);
      const snap = await getDocs(query(collection(db, 'quotations'), where('clientId', '==', customerId)));
      if (snap.empty) {
        const cDoc = await getDoc(doc(db, 'customers', customerId));
        if (cDoc.exists()) setClientName(cDoc.data().name || '');
        await fetchNextQuotationNo();
        toast.info('Started new quotation');
        return;
      }
      let latest: (QuotationData & { id: string }) | null = null;
      let latestTs = new Date(0);
      snap.forEach(d => {
        const data = d.data() as QuotationData;
        const ts = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(0);
        if (ts > latestTs) { latestTs = ts; latest = { ...data, id: d.id }; }
      });
      if (!latest) return;
      const q = latest as QuotationData & { id: string };
      setSiteCode(q.siteCode || '');
      setSiteAddress(q.siteAddress || '');
      setClientName(q.clientName || '');
      setQuotationNo(q.quotationNo || 'A00001');
      setValidTill(q.validTill || '');
      const vNums = snap.docs
        .filter(d => (d.data() as QuotationData).siteCode === q.siteCode)
        .map(d => parseInt((d.data() as QuotationData).version.substring(1)))
        .sort((a, b) => b - a);
      setVersion(`V${vNums.length > 0 ? vNums[0] + 1 : 1} `);
      setItems(q.items || []);
      const existing = q.services || [];
      const merged = DEFAULT_SERVICES.map(ds => existing.find(s => s.type === ds.type) || ds);
      const custom = existing.filter(s => !DEFAULT_SERVICES.some(ds => ds.type === s.type));
      setServices([...merged, ...custom]);
      setTerms(q.terms && q.terms.length > 0 ? q.terms : [...masterTerms]);
      toast.info('Loaded latest quotation');
    } catch { toast.error('Error loading quotation'); }
  };

  // ─── Item Type CRUD ────────────────────────────────────────────────────────

  const addItemType = async () => {
    if (!newTypeName || newTypeRate === '') { toast.warning('Name and rate required'); return; }
    try {
      const data: Omit<ItemType, 'id'> = { name: newTypeName, rate: Number(newTypeRate), isLumpsum: newTypeIsLumpsum };
      const ref = await addDoc(collection(db, 'itemTypes'), data);
      setItemTypes(prev => [...prev, { id: ref.id, ...data }]);
      setNewTypeName(''); setNewTypeRate(''); setNewTypeIsLumpsum(false);
      toast.success('Item type added');
    } catch { toast.error('Failed to add item type'); }
  };

  const saveEditedType = async () => {
    if (!editingType?.id) return;
    const { id, name, rate, isLumpsum } = editingType;
    try {
      await updateDoc(doc(db, 'itemTypes', id), { name, rate, isLumpsum });
      setItemTypes(prev => prev.map(t => t.id === id ? editingType : t));
      setItems(prev => prev.map(i => i.type === name ? { ...i, price: rate } : i));
      setEditingType(null);
      toast.success('Item type updated');
    } catch { toast.error('Failed to update item type'); }
  };

  const deleteItemType = async (type: ItemType) => {
    if (!type.id || !window.confirm(`Delete "${type.name}" ? `)) return;
    try {
      await deleteDoc(doc(db, 'itemTypes', type.id));
      setItemTypes(prev => prev.filter(t => t.id !== type.id));
      toast.success('Item type deleted');
    } catch { toast.error('Failed to delete item type'); }
  };

  // ─── Room CRUD ─────────────────────────────────────────────────────────────

  const addRoom = () => {
    if (!newRoomName) return;
    if (rooms.includes(newRoomName)) { toast.warning('Room already exists'); return; }
    setRooms(prev => [...prev, newRoomName]);
    setNewRoomName('');
  };

  const saveEditedRoom = () => {
    if (!editingRoom) return;
    if (rooms.includes(editingRoom.newName) && editingRoom.oldName !== editingRoom.newName) {
      toast.warning('Room already exists'); return;
    }
    setRooms(prev => prev.map(r => r === editingRoom.oldName ? editingRoom.newName : r));
    setItems(prev => prev.map(i => i.room === editingRoom.oldName ? { ...i, room: editingRoom.newName } : i));
    setEditingRoom(null);
  };

  const deleteRoom = (name: string) => {
    if (!window.confirm(`Delete "${name}" ? All items will be removed.`)) return;
    setRooms(prev => prev.filter(r => r !== name));
    setItems(prev => prev.filter(i => i.room !== name));
  };

  // ─── Item CRUD ─────────────────────────────────────────────────────────────

  const addItem = (room: string) => {
    const first = itemTypes[0];
    const newItem: QuotationItem = {
      id: String(Date.now()),
      name: first?.name || '',
      quantity: 1,
      rate: first?.rate || 0,
      amount: 0,
      isLumpsum: first?.isLumpsum || false,
      room,
      item: '',
      d1: 1,
      d2: 1,
      type: first?.name || '',
      area: 1,
      price: first?.rate || 0,
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (itemId: string, field: keyof QuotationItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const updated: QuotationItem = { ...item, [field]: value };

      if (field === 'type') {
        if (value === '__custom__') {
          updated.price = 0;
          updated.isLumpsum = false;
          updated.customTypeName = '';
        } else {
          const t = itemTypes.find(t => t.name === value);
          if (t) {
            updated.price = t.rate;
            updated.isLumpsum = t.isLumpsum;
            if (t.isLumpsum) { updated.d1 = 1; updated.d2 = 1; updated.area = 1; }
          }
        }
      }

      // Handle area calculation for both predefined and custom types
      const isLump = updated.type === '__custom__' ? updated.isLumpsum : itemTypes.find(t => t.name === updated.type)?.isLumpsum;
      if ((field === 'd1' || field === 'd2') && !isLump) {
        updated.area = (updated.d1 ?? 0) * (updated.d2 ?? 0);
      }

      return updated;
    }));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  // ─── Services ──────────────────────────────────────────────────────────────

  const handleServiceChange = (index: number, field: 'type' | 'price' | 'details', value: string | number) => {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: field === 'price' ? Number(value) : value } : s));
  };

  const addService = () => setServices(prev => [...prev, { type: '', price: 0, details: '' }]);

  const removeService = (i: number) => {
    if (i < 3) { toast.error('Cannot remove default services'); return; }
    setServices(prev => prev.filter((_, idx) => idx !== i));
  };

  // ─── Terms ─────────────────────────────────────────────────────────────────

  const addTerm = () => { if (!newTerm) return; setTerms(prev => [...prev, newTerm]); setNewTerm(''); };
  const updateTerm = () => {
    if (!editingTerm) return;
    setTerms(prev => prev.map((t, i) => i === editingTerm.index ? editingTerm.text : t));
    setEditingTerm(null);
  };
  const deleteTerm = (i: number) => setTerms(prev => prev.filter((_, idx) => idx !== i));
  const moveTerm = (i: number, dir: 'up' | 'down') => {
    const ni = dir === 'up' ? i - 1 : i + 1;
    if (ni < 0 || ni >= terms.length) return;
    const arr = [...terms];
    [arr[i], arr[ni]] = [arr[ni], arr[i]];
    setTerms(arr);
  };

  // ─── Calculations ──────────────────────────────────────────────────────────

  const calcItemsSubtotal = () => items.reduce((sum, item) => {
    const isCustom = item.type === '__custom__';
    const t = isCustom ? null : itemTypes.find(t => t.name === item.type);
    const isLump = isCustom ? item.isLumpsum : t?.isLumpsum;
    const itemAmount = isLump ? item.price : item.price * item.area;
    return sum + itemAmount;
  }, 0);
  const calcServicesTotal = () => services.reduce((s, sv) => s + sv.price, 0);
  const calcSubtotal = () => calcItemsSubtotal() + calcServicesTotal();
  const calcCgstAmt = () => (calcSubtotal() * cgst) / 100;
  const calcSgstAmt = () => (calcSubtotal() * sgst) / 100;
  const calcDiscountAmt = () => (calcSubtotal() * discount) / 100;
  const calcTotal = () => calcSubtotal() + calcCgstAmt() + calcSgstAmt() - calcDiscountAmt();
  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')} `;

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedCustomer) { toast.warning('Please select a customer'); return; }
    try {
      const snap = await getDocs(query(
        collection(db, 'quotations'),
        where('clientId', '==', selectedCustomer),
        where('siteCode', '==', siteCode)
      ));
      let maxV = 0;
      snap.forEach(d => {
        const v = parseInt((d.data().version || 'V0').substring(1));
        if (v > maxV) maxV = v;
      });
      const data: QuotationData & { sentToClient: boolean } = {
        clientId: selectedCustomer,
        clientName,
        customerEmail: customers.find(c => c.id === selectedCustomer)?.email || '',
        siteCode,
        siteAddress,
        version: `V${maxV + 1}`,
        date,
        items,
        services,
        terms,
        total: Math.round(calcTotal()),
        quotationNo,
        validTill,
        timestamp: Timestamp.now(),
        sentToClient: false,   // Hidden from customer until admin sends it
      };
      const docRef = await addDoc(collection(db, 'quotations'), data);
      setSavedQuotationId(docRef.id);
      setIsSentToClient(false);

      // Refresh next quotation number for future use
      await fetchNextQuotationNo();

      toast.success('Quotation saved! Use "Send to Client" when ready to share.');
    } catch (err) {
      console.error(err);
      toast.error('Error saving quotation');
    }
  };

  const sendQuotationToClient = async () => {
    if (!savedQuotationId) { toast.warning('Save the quotation first'); return; }
    setIsSending(true);
    try {
      await updateDoc(doc(db, 'quotations', savedQuotationId), { sentToClient: true });
      setIsSentToClient(true);

      const customerEmail = customers.find(c => c.id === selectedCustomer)?.email || '';
      await createNotification(
        customerEmail,
        'New Quotation Received',
        `A new quotation version has been shared for your site "${siteCode}". Please login to view it.`,
        'new_quotation',
        '/customer/dashboard/quotations'
      );

      toast.success('Quotation sent to client successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Error sending quotation to client');
    } finally {
      setIsSending(false);
    }
  };


  // ─── PDF ───────────────────────────────────────────────────────────────────

  const generatePDF = () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = pdf.internal.pageSize.getWidth();
    const PH = pdf.internal.pageSize.getHeight();
    const ML = 14, MR = 14, CW = PW - ML - MR;

    type RGB = [number, number, number];
    const C = {
      brown: [101, 48, 16] as RGB,
      brownDark: [78, 38, 8] as RGB,
      brownMid: [139, 69, 19] as RGB,
      gold: [194, 154, 68] as RGB,
      cream: [253, 248, 235] as RGB,
      creamLight: [255, 253, 248] as RGB,
      offWhite: [248, 245, 238] as RGB,
      white: [255, 255, 255] as RGB,
      black: [20, 20, 20] as RGB,
      darkGray: [55, 55, 55] as RGB,
      midGray: [110, 110, 110] as RGB,
      lightGray: [210, 205, 195] as RGB,
      amtOrange: [176, 78, 18] as RGB,
    };
    const sf = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
    const sd = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);
    const st = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);
    const lw = (w: number) => pdf.setLineWidth(w);

    // ─── drawHeader (page 1 only) ────────────────────────────────────────────
    const drawHeader = () => {
      sf(C.cream); pdf.rect(0, 0, PW, 62, 'F');
      sf(C.brown); pdf.rect(0, 0, 5, 62, 'F');
      sf(C.gold); pdf.rect(5, 0, PW - 5, 2.5, 'F');
      try { pdf.addImage('/images/logo.png', 'PNG', 10, 8, 34, 34); } catch (_) { }
      st(C.brown); pdf.setFontSize(21); pdf.setFont('helvetica', 'bold');
      pdf.text(companySettings?.name || 'LIVORAA ATELIER', 50, 22);
      st(C.brownMid); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'italic');
      pdf.text('Interior Design & Decor Solutions', 50, 29);
      st(C.midGray); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
      pdf.text('CRAFTED LIVING', 50, 35);
      sd(C.gold); lw(0.6);
      pdf.line(PW - 62, 6, PW - 62, 56);
      st(C.brown); pdf.setFontSize(19); pdf.setFont('helvetica', 'bold');
      pdf.text('QUOTATION', PW - 58, 26);
      st(C.brownMid); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
      pdf.text('ESTIMATION / ESTIMATE', PW - 58, 33);
      sf(C.gold); lw(0); pdf.rect(0, 62, PW, 1.5, 'F');
      sf(C.brown); pdf.rect(0, 63.5, PW, 0.6, 'F');
    };

    // ─── drawPageHeader (continuation pages) ────────────────────────────────
    const drawPageHeader = () => {
      sf(C.brownDark); pdf.rect(0, 0, PW, 13, 'F');
      sf(C.gold); pdf.rect(0, 13, PW, 0.7, 'F');
      st(C.white); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
      pdf.text('LIVORAA ATELIER', ML, 8.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Quotation — ${clientName || ''}  | ${siteCode || ''}  | ${version} `, PW - MR, 8.5, { align: 'right' });
    };

    // ─── drawFooter (all pages) ──────────────────────────────────────────────
    const drawFooter = (pageNum: number, total: number) => {
      sf(C.gold); lw(0); pdf.rect(0, PH - 15, PW, 0.6, 'F');
      sf(C.brownDark); pdf.rect(0, PH - 14.4, PW, 14.4, 'F');
      st(C.white); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
      pdf.text(companySettings?.name || 'LIVORAA ATELIER', ML, PH - 9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(companySettings?.address || 'Kukatpally, Hyderabad, India', ML, PH - 4.5);
      st(C.gold); pdf.setFontSize(7);
      pdf.text(`${companySettings?.phone || '+91 90001 91496'}  | ${companySettings?.email || 'livoraaatelier@gmail.com'}  | GST: ${companySettings?.gstNumber || '36AAMFL7643J1ZS'} `, PW / 2, PH - 9, { align: 'center' });
      st(C.lightGray); pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${pageNum} of ${total} `, PW - MR, PH - 4.5, { align: 'right' });
    };

    // ════════════════════ PAGE 1 ══════════════════════════════════════════════
    drawHeader();
    let y = 68;

    // ─── Meta info panel ─────────────────────────────────────────────────────
    sf(C.offWhite); sd(C.lightGray); lw(0.2);
    pdf.roundedRect(ML, y, CW, 28, 1.5, 1.5, 'FD');
    sf(C.brown); pdf.rect(ML, y, 3, 28, 'F');

    const metaL = [['QUOTATION NO', quotationNo || '—'], ['DATE', date || '—']];
    const metaR = [['VALID UNTIL', validTill || '—'], ['PREPARED BY', 'Livoraa Atelier']];

    metaL.forEach(([k, v], i) => {
      const ry = y + 9 + i * 11;
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); st(C.midGray);
      pdf.text(k, ML + 7, ry);
      pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); st(C.brown);
      pdf.text(v, ML + 7, ry + 5);
    });
    metaR.forEach(([k, v], i) => {
      const ry = y + 9 + i * 11;
      pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); st(C.midGray);
      pdf.text(k, PW / 2 + 5, ry);
      pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); st(C.brown);
      pdf.text(v, PW / 2 + 5, ry + 5);
    });

    y += 34;

    // ─── FROM / TO cards ─────────────────────────────────────────────────────
    const cardH = 44, cW = (CW - 5) / 2;

    sf(C.white); sd(C.lightGray); lw(0.2);
    pdf.roundedRect(ML, y, cW, cardH, 1.5, 1.5, 'FD');
    sf(C.brown); pdf.rect(ML, y, 3, cardH, 'F');
    pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); st(C.brown);
    pdf.text('FROM', ML + 7, y + 6.5);
    sd(C.gold); lw(0.5); pdf.line(ML + 7, y + 8.5, ML + 32, y + 8.5);
    pdf.setFontSize(9.5); pdf.setFont('helvetica', 'bold'); st(C.black);
    pdf.text(companySettings?.name || 'LIVORAA ATELIER', ML + 7, y + 15);
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); st(C.darkGray);
    [
      companySettings?.address || 'Kukatpally, Hyderabad — 500072, India',
      companySettings?.phone || '+91 90001 91496',
      companySettings?.email || 'livoraaatelier@gmail.com',
      `GST: ${companySettings?.gstNumber || '36AAMFL7643J1ZS'}`,
    ].forEach((l, i) => pdf.text(l, ML + 7, y + 21 + i * 5.5));

    const tX = ML + cW + 5;
    sf(C.white); sd(C.lightGray); lw(0.2);
    pdf.roundedRect(tX, y, cW, cardH, 1.5, 1.5, 'FD');
    sf(C.brownMid); pdf.rect(tX, y, 3, cardH, 'F');
    pdf.setFontSize(6.5); pdf.setFont('helvetica', 'bold'); st(C.brownMid);
    pdf.text('BILLED TO', tX + 7, y + 6.5);
    sd(C.gold); lw(0.5); pdf.line(tX + 7, y + 8.5, tX + 36, y + 8.5);
    pdf.setFontSize(9.5); pdf.setFont('helvetica', 'bold'); st(C.black);
    pdf.text(clientName || '—', tX + 7, y + 15);
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal'); st(C.darkGray);
    (pdf.splitTextToSize(siteAddress || '—', cW - 12) as string[]).slice(0, 3)
      .forEach((l: string, i: number) => pdf.text(l, tX + 7, y + 21 + i * 5.5));
    if (siteCode) {
      st(C.brown); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7);
      pdf.text(`Site Code: ${siteCode} `, tX + 7, y + 40);
    }

    y += cardH + 7;

    // Gold rule before table
    sf(C.gold); lw(0); pdf.rect(ML, y, CW, 0.6, 'F');
    y += 4;

    // ─── Items table ─────────────────────────────────────────────────────────
    const allRows = items.map((item, idx) => {
      const isCustom = item.type === '__custom__';
      const t = isCustom ? null : itemTypes.find(t => t.name === item.type);
      const isLump = isCustom ? item.isLumpsum : t?.isLumpsum;
      const typeLabel = isCustom ? (item.customTypeName || 'Custom') : item.type;
      const itemName = item.item === '__custom_item__' ? (item.customItemLabel || 'Custom Item') : (item.item || '—');

      const qty = isLump ? 1 : item.area;
      const amt = isLump ? item.price : item.price * item.area;

      return [
        String(idx + 1),
        `${itemName} [${typeLabel}] (${item.room})`,
        isLump ? 'Lumpsum' : `${qty.toFixed(2)} sft`,
        `Rs.${item.price.toLocaleString('en-IN')} `,
        `Rs.${Math.round(amt).toLocaleString('en-IN')} `,
      ];
    });

    autoTable(pdf, {
      startY: y,
      head: [['NO.', 'DESCRIPTION', 'QTY / SFT', 'RATE', 'AMOUNT']],
      body: allRows.length > 0 ? allRows : [['—', 'No items configured for this quotation', '—', '—', '—']],
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 4, // Clean, even padding that prevents word splitting
        lineColor: C.brownDark, // Matches theme and enforces grid visibility
        lineWidth: 0.15,
        textColor: C.black,
        font: 'helvetica',
        valign: 'middle',
      },
      headStyles: {
        fillColor: C.brownDark,
        textColor: C.white,
        fontStyle: 'bold',
        halign: 'center',
        minCellHeight: 10,
        lineColor: C.brownDark,
        lineWidth: 0.15, // Vital to ensure the gridlines match the body gridlines
      },
      alternateRowStyles: { fillColor: C.offWhite },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: C.amtOrange },
      },
      margin: { left: ML, right: MR, bottom: 25 },
      didDrawPage: (data) => { if (data.pageNumber > 1) drawPageHeader(); },
      didParseCell: (data) => {
        if (data.section === 'head') {
          if (data.column.index === 1) data.cell.styles.halign = 'left';
          if (data.column.index === 3 || data.column.index === 4) data.cell.styles.halign = 'right';
        }
      }
    });
    y = (pdf as any).lastAutoTable.finalY;

    // ─── Additional Services ──────────────────────────────────────────────────
    const svcItems = services.filter(s => s.price > 0);
    if (svcItems.length > 0) {
      if (y + 45 > PH - 25) { pdf.addPage(); drawPageHeader(); y = 18; }

      // Section separator rule
      sf(C.gold); lw(0.5); pdf.rect(ML, y, CW, 0.5, 'F');
      y += 5;

      autoTable(pdf, {
        startY: y,
        head: [['NO.', 'SERVICE DESCRIPTION', 'PARTICULARS', 'AMOUNT']],
        body: svcItems.map((s, i) => [
          String(allRows.length + i + 1),
          s.type.toUpperCase(),
          s.details || '—',
          `Rs.${Math.round(s.price).toLocaleString('en-IN')} `
        ]),
        theme: 'grid',
        styles: {
          fontSize: 8.5,
          cellPadding: 4,
          lineColor: C.brownDark,
          lineWidth: 0.15,
          textColor: C.black,
          valign: 'middle'
        },
        headStyles: {
          fillColor: C.brownDark,
          textColor: C.white,
          fontStyle: 'bold',
          halign: 'center',
          minCellHeight: 10,
          lineColor: C.brownDark,
          lineWidth: 0.15,
        },
        alternateRowStyles: { fillColor: C.offWhite },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 45, halign: 'left' },
          2: { cellWidth: 'auto', halign: 'left' },
          3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: C.amtOrange },
        },
        margin: { left: ML, right: MR, bottom: 25 },
        didDrawPage: (data) => { if (data.pageNumber > 1) drawPageHeader(); },
        didParseCell: (data) => {
          if (data.section === 'head') {
            if (data.column.index === 1 || data.column.index === 2) data.cell.styles.halign = 'left';
            if (data.column.index === 3) data.cell.styles.halign = 'right';
          }
        }
      });
      y = (pdf as any).lastAutoTable.finalY;
    }

    y += 10;

    // ─── Summary box ─────────────────────────────────────────────────────────
    const sumW = 84, sumX = PW - MR - sumW;
    if (y + 65 > PH - 25) { pdf.addPage(); drawPageHeader(); y = 18; }

    sd(C.gold); lw(0.5); pdf.roundedRect(sumX, y, sumW, 56, 1.5, 1.5, 'S');
    sf(C.brown); pdf.rect(sumX, y, sumW, 6, 'F');
    st(C.white); pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
    pdf.text('AMOUNT SUMMARY', sumX + sumW / 2, y + 4.2, { align: 'center' });

    const summaryLines: [string, string][] = [
      ['Sub Total', `Rs.${Math.round(calcSubtotal()).toLocaleString('en-IN')} `],
      [`CGST @${cgst}% `, `Rs.${Math.round(calcCgstAmt()).toLocaleString('en-IN')} `],
      [`SGST @${sgst}% `, `Rs.${Math.round(calcSgstAmt()).toLocaleString('en-IN')} `],
      [`Discount @${discount}% `, ` - Rs.${Math.round(calcDiscountAmt()).toLocaleString('en-IN')} `],
    ];

    let rowY = y + 12;
    summaryLines.forEach(([label, val]) => {
      sd(C.lightGray); lw(0.12); pdf.line(sumX + 5, rowY - 2, sumX + sumW - 5, rowY - 2);
      st(C.midGray); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
      pdf.text(label, sumX + 7, rowY + 2.5);
      st(C.darkGray); pdf.setFont('helvetica', 'bold');
      pdf.text(val, sumX + sumW - 7, rowY + 2.5, { align: 'right' });
      rowY += 9;
    });

    const totY = y + 46;
    sd(C.gold); lw(0.4); pdf.line(sumX + 3, totY - 1, sumX + sumW - 3, totY - 1);
    sf(C.brownDark); pdf.rect(sumX, totY, sumW, 10, 'F');
    st(C.white); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL', sumX + 7, totY + 7.2);
    st(C.gold);
    pdf.text(`Rs.${Math.round(calcTotal()).toLocaleString('en-IN')} `, sumX + sumW - 7, totY + 7.2, { align: 'right' });

    y = totY + 18;

    // ─── Terms & Conditions ───────────────────────────────────────────────────
    if (terms.length > 0) {
      if (y + 55 > PH - 25) { pdf.addPage(); drawPageHeader(); y = 18; }
      sf(C.cream); sd(C.gold); lw(0.4); pdf.rect(ML, y, CW, 9, 'FD');
      sf(C.brown); pdf.rect(ML, y, 4, 9, 'F');
      st(C.brown); pdf.setFontSize(9.5); pdf.setFont('helvetica', 'bold');
      pdf.text('TERMS & CONDITIONS', ML + 8, y + 6.3);
      sd(C.gold); lw(0.5);
      pdf.line(ML + 8, y + 7.5, ML + 8 + pdf.getTextWidth('TERMS & CONDITIONS'), y + 7.5);
      y += 18;

      pdf.setFontSize(8);
      terms.forEach((term, i) => {
        const lines = pdf.splitTextToSize(`${i + 1}.  ${term} `, CW - 12) as string[];
        const blockH = lines.length * 5.2 + 2;
        if (y + blockH > PH - 22) { pdf.addPage(); drawPageHeader(); y = 18; }
        sf(C.brownMid); pdf.circle(ML + 2.5, y + 1.8, 1.2, 'F');
        pdf.setFont('helvetica', 'normal'); st(C.darkGray);
        lines.forEach((l: string, li: number) => pdf.text(l, ML + 8, y + li * 5.2));
        y += blockH;
      });
    }

    y += 7;

    // ─── Enquiry bar ──────────────────────────────────────────────────────────
    if (y + 13 > PH - 20) { pdf.addPage(); drawPageHeader(); y = PH - 50; }
    sf(C.brown); lw(0); pdf.rect(ML, y, CW, 12, 'F');
    sf(C.gold); pdf.rect(ML, y, 3, 12, 'F');
    pdf.rect(ML + CW - 3, y, 3, 12, 'F');
    st(C.white); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'bold');
    pdf.text('For enquiries:', ML + 7, y + 8);
    st(C.gold); pdf.setFont('helvetica', 'normal');
    pdf.text('livoraaatelier@gmail.com  |  +91 90001 91496', ML + 39, y + 8);

    // ─── Footer on all pages ──────────────────────────────────────────────────
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      drawFooter(p, totalPages);
    }

    pdf.save(`Quotation_${clientName || 'Client'}_${version}.pdf`);
  };


  // ─── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 pb-16">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Quotation Generator</h1>
          <p className="text-gray-400 font-medium mt-2">Create professional quotations for your interior projects</p>
        </div>
        <img src="/images/logo.png" alt="Logo" className="h-16 w-auto object-contain opacity-80" />
      </div>

      {/* Client Information */}
      <Section title="Client Information" subtitle="Enter the client and project details">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className={labelCls}>Select Customer</label>
            <div
              className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-700 shadow-inner cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors"
              onClick={() => setIsCustomerPopupOpen(true)}
            >
              <span className={selectedCustomer ? 'text-gray-700' : 'text-gray-400'}>
                {customers.find(c => c.id === selectedCustomer)?.name || 'Click to select customer'}
              </span>
              <UserIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Site Code</label>
            <input className={inputCls} value={siteCode} onChange={e => setSiteCode(e.target.value)} placeholder="NZB01" />
          </div>
          <div>
            <label className={labelCls}>Quotation Date</label>
            <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Valid Till Date</label>
            <input type="date" className={inputCls} value={validTill} onChange={e => setValidTill(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Quotation No #</label>
            <input className={inputCls} value={quotationNo} onChange={e => setQuotationNo(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Version</label>
            <input className={`${inputCls} bg - gray - 100 cursor - not - allowed`} value={version} readOnly />
          </div>
          <div>
            <label className={labelCls}>Client Name</label>
            <input className={inputCls} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client name" />
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <label className={labelCls}>Site Address</label>
            <textarea className={inputCls} rows={2} value={siteAddress} onChange={e => setSiteAddress(e.target.value)} placeholder="Enter complete site address" />
          </div>
        </div>
      </Section>

      {/* Item Types & Rates */}
      <Section
        title="Item Types & Rates"
        subtitle="Manage item types and their rates."
        action={
          <>
            <input
              className="p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 shadow-inner outline-none w-40 focus:ring-2 focus:ring-indigo-100"
              placeholder="Type Name"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
            />
            <input
              type="number"
              className="p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 shadow-inner outline-none w-28 focus:ring-2 focus:ring-indigo-100"
              placeholder="Rate"
              value={newTypeRate}
              onChange={e => setNewTypeRate(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <label className="flex items-center gap-2 font-bold text-gray-500 text-sm cursor-pointer select-none">
              <input type="checkbox" checked={newTypeIsLumpsum} onChange={e => setNewTypeIsLumpsum(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-100 w-4 h-4" />
              Lumpsum
            </label>
            <button
              onClick={addItemType}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"
            >
              Add Type
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {itemTypes.map(type => {
            const isEdit = editingType?.id === type.id;
            return (
              <div
                key={type.id}
                className={`border rounded - [1.5rem] p - 6 transition - all duration - 300 ${isEdit ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50'} `}
              >
                {isEdit && editingType ? (
                  <div className="space-y-3">
                    <input
                      className={inputCls}
                      value={editingType.name}
                      onChange={e => setEditingType(prev => prev ? { ...prev, name: e.target.value } : prev)}
                    />
                    <input
                      type="number"
                      className={inputCls}
                      value={editingType.rate}
                      onChange={e => setEditingType(prev => prev ? { ...prev, rate: Number(e.target.value) } : prev)}
                    />
                    <label className="flex items-center gap-2 font-bold text-gray-500 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingType.isLumpsum}
                        onChange={e => setEditingType(prev => prev ? { ...prev, isLumpsum: e.target.checked } : prev)}
                        className="rounded text-indigo-600 w-4 h-4"
                      />
                      Lumpsum
                    </label>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={saveEditedType}
                        className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckIcon className="w-4 h-4" /> Save
                      </button>
                      <button
                        onClick={() => setEditingType(null)}
                        className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-black text-gray-800 text-base mb-1">{type.name}</h3>
                    <p className="text-sm font-bold text-gray-500 mb-1">
                      ₹{type.rate.toLocaleString('en-IN')}/{type.isLumpsum ? 'Lumpsum' : 'SFT'}
                    </p>
                    {type.isLumpsum && (
                      <span className="inline-block px-2.5 py-1 bg-violet-100 text-violet-600 rounded-lg text-[10px] font-black uppercase tracking-wider mb-3">
                        Lumpsum
                      </span>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => setEditingType({ ...type })}
                        className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItemType(type)}
                        className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {itemTypes.length === 0 && (
            <div className="col-span-3 py-12 text-center text-gray-300 font-bold">
              No item types yet. Add one above.
            </div>
          )}
        </div>
      </Section>

      {/* Room-wise Items */}
      {rooms.map(room => (
        <Section
          key={room}
          title={room}
          subtitle={`${items.filter(i => i.room === room).length} items configured`}
          action={
            editingRoom?.oldName === room ? (
              <>
                <input
                  className="p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 shadow-inner outline-none w-40 focus:ring-2 focus:ring-indigo-100"
                  value={editingRoom.newName}
                  onChange={e => setEditingRoom({ ...editingRoom, newName: e.target.value })}
                />
                <button onClick={saveEditedRoom} className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors">
                  Save
                </button>
                <button onClick={() => setEditingRoom(null)} className="px-5 py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditingRoom({ oldName: room, newName: room })} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
                  <PencilSquareIcon className="w-5 h-5" />
                </button>
                <button onClick={() => deleteRoom(room)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </>
            )
          }
        >
          <button
            onClick={() => addItem(room)}
            className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> Add Item
          </button>

          {items.filter(i => i.room === room).length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100">
                    <th className="text-left pb-4 pr-4">Item</th>
                    <th className="text-left pb-4 pr-4">Type</th>
                    <th className="text-left pb-4 pr-4">Quantity/SFT</th>
                    <th className="text-left pb-4 pr-4">Amount</th>
                    <th className="text-left pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.filter(i => i.room === room).map(item => {
                    const t = item.type === '__custom__' ? null : itemTypes.find(t => t.name === item.type);
                    const isLump = item.type === '__custom__' ? item.isLumpsum : t?.isLumpsum;
                    const amt = isLump ? item.price : item.price * item.area;
                    return (
                      <tr key={item.id}>
                        <td className="py-4 pr-4">
                          <select
                            className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 text-sm appearance-none"
                            value={item.item === '__custom_item__' ? '__custom_item__' : item.item}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '__custom_item__') {
                                updateItem(item.id, 'item', '__custom_item__');
                                updateItem(item.id, 'customItemLabel' as any, '');
                              } else {
                                updateItem(item.id, 'item', val);
                                const found = itemTypes.find(t => t.name === val);
                                if (found) {
                                  updateItem(item.id, 'type', found.name);
                                }
                              }
                            }}
                          >
                            <option value="">Select Item</option>
                            {/* Unique item names from itemTypes list */}
                            {Array.from(new Set(itemTypes.map(t => t.name))).map(name => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                            <option value="__custom_item__">— Custom (enter below) —</option>
                          </select>
                          {item.item === '__custom_item__' && (
                            <div className="mt-2">
                              <input
                                type="text"
                                className="w-full p-2 bg-amber-50 border border-amber-200 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-200 text-sm"
                                placeholder="Enter custom item name"
                                value={item.customItemLabel ?? ''}
                                onChange={e => updateItem(item.id, 'customItemLabel' as any, e.target.value)}
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <select
                            value={item.type}
                            onChange={e => {
                              const val = e.target.value;
                              updateItem(item.id, 'type', val);
                              if (val === '__custom__') {
                                // Reset price for custom type entry
                                updateItem(item.id, 'price', 0);
                              }
                            }}
                            className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 text-sm appearance-none"
                          >
                            <option value="">Select Type</option>
                            {itemTypes.map(t => (
                              <option key={t.id} value={t.name}>
                                {t.name} ({t.isLumpsum ? `₹${t.rate.toLocaleString('en-IN')} Lumpsum` : `₹${t.rate.toLocaleString('en-IN')}/sft`})
                              </option>
                            ))}
                            <option value="__custom__">— Custom (enter below) —</option>
                          </select>
                          {/* Custom type inline inputs */}
                          {item.type === '__custom__' && (
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                className="flex-1 p-2 bg-amber-50 border border-amber-200 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-200 text-sm"
                                placeholder="Custom type name"
                                value={item.customTypeName ?? ''}
                                onChange={e => updateItem(item.id, 'customTypeName' as any, e.target.value)}
                              />
                              <input
                                type="number"
                                className="w-24 p-2 bg-amber-50 border border-amber-200 rounded-xl font-bold text-gray-700 outline-none focus:ring-2 focus:ring-amber-200 text-sm"
                                placeholder="Rate"
                                value={item.price || ''}
                                onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                              />
                              <label className="flex items-center gap-1 text-xs text-gray-500 font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={item.isLumpsum}
                                  onChange={e => {
                                    setItems(prev => prev.map(i =>
                                      i.id === item.id ? { ...i, isLumpsum: e.target.checked } : i
                                    ));
                                  }}
                                  className="rounded"
                                />
                                Lump
                              </label>
                            </div>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          {isLump ? (
                            <span className="text-sm font-bold text-indigo-500 bg-indigo-50 px-3 py-2 rounded-xl">Lumpsum</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                className="w-20 p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                                value={item.d1 ?? 1}
                                onChange={e => updateItem(item.id, 'd1', parseFloat(e.target.value) || 0)}
                                placeholder="D1"
                              />
                              <span className="text-gray-400 font-black">×</span>
                              <input
                                type="number"
                                className="w-20 p-3 bg-gray-50 border-none rounded-xl font-bold text-gray-700 shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 text-sm"
                                value={item.d2 ?? 1}
                                onChange={e => updateItem(item.id, 'd2', parseFloat(e.target.value) || 0)}
                                placeholder="D2"
                              />
                              <span className="text-xs text-gray-400 font-bold">= {item.area.toFixed(2)} sft</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-700 font-black text-sm text-right whitespace-nowrap">
                            ₹ {amt.toLocaleString('en-IN')}
                          </div>
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="px-4 py-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr >
                    );
                  })}
                </tbody >
              </table >

              {/* Room subtotal */}
              < div className="mt-4 flex justify-end" >
                <div className="bg-indigo-50 rounded-2xl px-6 py-3 text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Room Total</span>
                  <span className="text-xl font-black text-indigo-700">
                    {fmt(items.filter(i => i.room === room).reduce((s, i) => {
                      const t = itemTypes.find(t => t.name === i.type);
                      return s + (t?.isLumpsum ? i.price : i.price * i.area);
                    }, 0))}
                  </span>
                </div>
              </div >
            </div >
          )}
        </Section >
      ))}

      {/* Add Room */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 px-10 py-8 flex items-center gap-4">
        <input
          className="flex-1 p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 shadow-inner outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder="New room name..."
          value={newRoomName}
          onChange={e => setNewRoomName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addRoom()}
        />
        <button
          onClick={addRoom}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" /> Add Room
        </button>
      </div>

      {/* Additional Services */}
      <Section
        title="Additional Services"
        subtitle="Configure extra services — false ceiling, electrical, painting, designer charges, etc."
        action={
          <button onClick={addService} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
            <PlusIcon className="w-4 h-4" /> Add Service
          </button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] pb-3 border-b border-gray-50">
            <div className="col-span-3">Service Type</div>
            <div className="col-span-3">Price (₹)</div>
            <div className="col-span-5">Description</div>
            <div className="col-span-1"></div>
          </div>
          {services.map((service, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3">
                <input
                  className={`${inputCls} ${idx < 3 ? 'opacity-60 cursor-not-allowed' : ''}`}
                  value={service.type}
                  onChange={e => handleServiceChange(idx, 'type', e.target.value)}
                  readOnly={idx < 3}
                />
              </div>
              <div className="col-span-3 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">₹</span>
                <input
                  type="number"
                  className={`${inputCls} pl-8`}
                  value={service.price}
                  onChange={e => handleServiceChange(idx, 'price', e.target.value)}
                />
              </div>
              <div className="col-span-5">
                <input
                  className={inputCls}
                  value={service.details}
                  onChange={e => handleServiceChange(idx, 'details', e.target.value)}
                  placeholder="Service details..."
                />
              </div>
              <div className="col-span-1 flex justify-center">
                {idx >= 3 && (
                  <button onClick={() => removeService(idx)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Tax & Discounts */}
      <Section title="Tax & Discounts" subtitle="Configure CGST, SGST, and discounts">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'CGST (%)', val: cgst, set: setCgst, amt: calcCgstAmt() },
            { label: 'SGST (%)', val: sgst, set: setSgst, amt: calcSgstAmt() },
            { label: 'Discount (%)', val: discount, set: setDiscount, amt: calcDiscountAmt() },
          ].map(({ label, val, set, amt }) => (
            <div key={label}>
              <label className={labelCls}>{label}</label>
              <input
                type="number"
                className={inputCls}
                value={val}
                onChange={e => set(Number(e.target.value))}
                min={0}
                max={100}
              />
              <p className="mt-2 text-sm font-bold text-gray-400">Amount: {fmt(amt)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Terms & Conditions */}
      <Section
        title="Terms & Conditions"
        subtitle="Manage terms and conditions for the quotation"
        action={
          <>
            <input
              className="p-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 shadow-inner outline-none focus:ring-2 focus:ring-indigo-100 w-80"
              placeholder="Add new term or condition"
              value={newTerm}
              onChange={e => setNewTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTerm()}
            />
            <button onClick={addTerm} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
              Add Term
            </button>
          </>
        }
      >
        <div className="space-y-3">
          {terms.map((term, i) => (
            <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-2xl p-5">
              <span className="inline-flex items-center justify-center w-7 h-7 bg-indigo-600 text-white text-xs font-black rounded-full shrink-0 mt-0.5">{i + 1}</span>
              {editingTerm?.index === i ? (
                <div className="flex-1 flex gap-3">
                  <input
                    className="flex-1 p-3 bg-white border-none rounded-xl font-bold text-gray-700 shadow-inner outline-none focus:ring-2 focus:ring-indigo-100"
                    value={editingTerm.text}
                    onChange={e => setEditingTerm({ ...editingTerm, text: e.target.value })}
                  />
                  <button onClick={updateTerm} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-colors">Save</button>
                  <button onClick={() => setEditingTerm(null)} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors">Cancel</button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium text-gray-700 leading-relaxed">{term}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveTerm(i, 'up')} disabled={i === 0} className="p-1.5 text-gray-300 hover:text-gray-500 disabled:opacity-30 rounded-lg hover:bg-gray-100 transition-colors">
                      <ChevronUpIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveTerm(i, 'down')} disabled={i === terms.length - 1} className="p-1.5 text-gray-300 hover:text-gray-500 disabled:opacity-30 rounded-lg hover:bg-gray-100 transition-colors">
                      <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingTerm({ index: i, text: term })} className="p-1.5 text-indigo-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteTerm(i)} className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {terms.length === 0 && <p className="text-center text-gray-300 font-bold py-6">No terms added yet</p>}
        </div>
      </Section>

      {/* Total Amount */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-gray-800">Total Amount</h3>
          <p className="text-gray-400 font-medium mt-1">Including all services and items</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-black text-gray-900">₹{Math.round(calcTotal()).toLocaleString('en-IN')}</div>
          <p className="text-sm font-bold text-gray-400 mt-2">
            Items Subtotal: {fmt(calcItemsSubtotal())} | Services: {fmt(calcServicesTotal())}
          </p>
          <p className="text-sm font-bold text-gray-400">
            CGST ({cgst}%): {fmt(calcCgstAmt())} | SGST ({sgst}%): {fmt(calcSgstAmt())}
          </p>
          <p className="text-sm font-bold text-gray-400">
            Discount ({discount}%): -{fmt(calcDiscountAmt())}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Status indicator — only shown after saving */}
        {savedQuotationId && (
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold ${isSentToClient
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isSentToClient ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`} />
            {isSentToClient
              ? '✅ Quotation has been sent to the client'
              : '⏳ Quotation saved as draft — not yet visible to client'}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={generatePDF}
            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            <DocumentTextIcon className="w-5 h-5" /> Generate PDF
          </button>
          <button
            onClick={handleSubmit}
            className="px-10 py-5 bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-800 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            <CheckIcon className="w-5 h-5" /> Save Quotation
          </button>
          <button
            onClick={sendQuotationToClient}
            disabled={!savedQuotationId || isSentToClient || isSending}
            className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 ${isSentToClient
              ? 'bg-green-600 text-white shadow-green-100 cursor-default'
              : !savedQuotationId
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'
              }`}
          >
            {isSending ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
            ) : isSentToClient ? (
              <><CheckIcon className="w-5 h-5" /> Sent to Client</>
            ) : (
              <><EnvelopeIcon className="w-5 h-5" /> Send to Client</>
            )}
          </button>
        </div>
      </div>

      {/* Customer Popup */}
      <CustomerSearchPopup
        customers={customers}
        isOpen={isCustomerPopupOpen}
        onClose={() => setIsCustomerPopupOpen(false)}
        onSelect={customer => { handleCustomerSelect(customer.id); setIsCustomerPopupOpen(false); }}
      />
    </div >
  );
};

export default QuotationGenerator;
