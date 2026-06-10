import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import {
  collection, getDocs, addDoc, query, where, Timestamp, doc, getDoc
} from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CustomerSearchPopup from './CustomerSearchPopup';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Customer } from '../types';
import { createNotification } from '../utils/notifications';
import {
  PlusIcon, TrashIcon, CheckIcon, UserIcon,
  CreditCardIcon, BanknotesIcon, ArrowPathIcon, DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReceiptItem {
  id: string;
  description: string;
  quantity: string | number;
  price: string | number;
  amount: string | number;
}

interface ReceiptData {
  receiptNo: string;
  quotationNo?: string;
  clientId: string;
  clientName: string;
  customerEmail: string;
  items: ReceiptItem[];
  total: number;
  paymentMethod: string;
  timestamp: Timestamp;
}

// ─── Reusable Section wrapper ──────────────────────────────────────────────────

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ElementType;
}

const Section = ({ title, subtitle, children, action, icon: Icon }: SectionProps) => (
  <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-8 transition-all hover:shadow-md">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-10 pt-10 pb-6 border-b border-gray-50">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="p-3 bg-indigo-50 rounded-2xl">
            <Icon className="w-6 h-6 text-indigo-600" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm font-medium text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap gap-3">{action}</div>}
    </div>
    <div className="px-10 py-8">{children}</div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const ReceiptGenerator = () => {
  const inputCls = "w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-100 font-bold text-gray-700 shadow-inner outline-none transition-all";
  const labelCls = "text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2";

  // ── Form State ──
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isCustomerPopupOpen, setIsCustomerPopupOpen] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [clientName, setClientName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [receiptNo, setReceiptNo] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quotationNo, setQuotationNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [items, setItems] = useState<ReceiptItem[]>([{ id: '1', description: '', quantity: '1', price: '0', amount: '0' }]);
  const [isDetailedView, setIsDetailedView] = useState(false);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const snap = await getDocs(collection(db, 'customers'));
        setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
      } catch { toast.error('Error loading customers'); }
    };

    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
          setCompanySettings(docSnap.data().companyInfo);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchCustomers();
    fetchNextReceiptNo();
    fetchSettings();
  }, []);

  const fetchNextReceiptNo = async () => {
    try {
      const snap = await getDocs(collection(db, 'receipts'));
      let maxNum = 0;
      snap.forEach(d => {
        const rNo: string = d.data().receiptNo || '';
        if (rNo.startsWith('RC-')) {
          const num = parseInt(rNo.replace('RC-', ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const nextNum = maxNum + 1;
      setReceiptNo(`RC-${String(nextNum).padStart(3, '0')}`);
    } catch {
      // fallback: 3-digit random
      setReceiptNo(`RC-${String(Math.floor(Math.random() * 900) + 100)}`);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer.id);
    setClientName(customer.name || '');
    setCustomerEmail(customer.email || '');
    setCustomerPhone((customer as any).phone || '');
    setIsManualEntry(false);
    setIsCustomerPopupOpen(false);
  };

  const handleManualEntry = () => {
    setIsManualEntry(true);
    setSelectedCustomer('');
    setClientName('');
    setCustomerEmail('');
    setCustomerPhone('');
  };

  const loadQuotation = async () => {
    if (!quotationNo) { toast.warning('Enter quotation number'); return; }
    setIsLoadingQuotation(true);
    try {
      const q = query(collection(db, 'quotations'), where('quotationNo', '==', quotationNo));
      const snap = await getDocs(q);
      if (snap.empty) { toast.error('Quotation not found'); return; }

      const qData = snap.docs[0].data();
      setClientName(qData.clientName || '');
      setCustomerEmail(qData.customerEmail || '');
      setSelectedCustomer(qData.clientId || '');

      const qItems = qData.items || [];
      setItems(qItems.map((item: any, idx: number) => {
        const qty = item.area || 1;
        const pr = item.price || 0;
        return {
          id: String(idx + 1),
          description: `${item.item} (${item.room})`,
          quantity: String(qty),
          price: String(pr),
          amount: String(Math.round(pr * qty))
        };
      }));

      toast.success('Quotation data loaded');
    } catch { toast.error('Error loading quotation'); }
    finally { setIsLoadingQuotation(false); }
  };

  const addItem = () => setItems([...items, { id: String(Date.now()), description: '', quantity: '1', price: '0', amount: '0' }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: string, updates: Partial<ReceiptItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const currentCustomer = customers.find(c => c.id === selectedCustomer);

  // ─── PDF Generation ────────────────────────────────────────────────────────

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

    // ─── Header ───
    sf(C.cream); pdf.rect(0, 0, PW, 62, 'F');
    sf(C.brown); pdf.rect(0, 0, 5, 62, 'F');
    sf(C.gold); pdf.rect(5, 0, PW - 5, 2.5, 'F');

    try { pdf.addImage('/images/logo.png', 'PNG', 10, 8, 34, 34); } catch (_) { }

    st(C.brown); pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
    pdf.text(companySettings?.name || 'LIVORAA ATELIER', 50, 24);
    st(C.brownMid); pdf.setFontSize(9); pdf.setFont('helvetica', 'italic');
    pdf.text('Interior Design & Decor Solutions', 50, 31);
    st(C.midGray); pdf.setFontSize(7); pdf.setFont('helvetica', 'normal');
    pdf.text('CRAFTED LIVING', 50, 37);

    // Receipt Badge
    sd(C.gold); lw(0.6);
    pdf.line(PW - 62, 6, PW - 62, 56);
    st(C.brown); pdf.setFontSize(19); pdf.setFont('helvetica', 'bold');
    pdf.text('RECEIPT', PW - 58, 26);
    st(C.brownMid); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
    pdf.text('PAYMENT ACKNOWLEDGEMENT', PW - 58, 33);

    sf(C.gold); lw(0); pdf.rect(0, 62, PW, 1.5, 'F');
    sf(C.brown); pdf.rect(0, 63.5, PW, 0.6, 'F');

    // Business Info Strip
    sf(C.offWhite); sd(C.lightGray); lw(0.2);
    pdf.roundedRect(ML, 68, CW, 12, 1.5, 1.5, 'FD');
    st(C.darkGray); pdf.setFontSize(7.5);
    pdf.text(companySettings?.address?.split(',')[0] || 'Kukatpally, Hyderabad', ML + 10, 75.5);
    pdf.text(companySettings?.phone || '+91 90001 91496', ML + 55, 75.5);
    pdf.text(companySettings?.email || 'livoraaatelier@gmail.com', ML + 95, 75.5);
    pdf.text(`GST: ${companySettings?.gstNumber || '36AAMFL7643J1ZS'}`, ML + 145, 75.5);

    // Info Boxes
    let y = 85;
    const boxW = (CW - 5) / 2;
    const boxH = 52;

    // Receipt Info
    sf(C.offWhite); sd(C.lightGray); lw(0.2);
    pdf.roundedRect(ML, y, boxW, boxH, 1.5, 1.5, 'FD');
    sf(C.brown); pdf.rect(ML, y, 3, boxH, 'F');
    st(C.brown); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
    pdf.text('RECEIPT INFORMATION', ML + 8, y + 8);
    sd(C.lightGray); lw(0.1); pdf.line(ML + 8, y + 10, ML + boxW - 8, y + 10);

    const infoY = y + 16;
    st(C.midGray); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
    pdf.text('Receipt No:', ML + 8, infoY);
    pdf.text('Date:', ML + 8, infoY + 8);
    pdf.text('Quotation Ref:', ML + 8, infoY + 16);
    pdf.text('Prepared By:', ML + 8, infoY + 24);
    pdf.text('Payment Mode:', ML + 8, infoY + 34);

    st(C.black); pdf.setFont('helvetica', 'bold');
    pdf.text(receiptNo, ML + boxW - 8, infoY, { align: 'right' });
    pdf.text(new Date(receiptDate + 'T00:00:00').toLocaleDateString('en-GB'), ML + boxW - 8, infoY + 8, { align: 'right' });
    pdf.text(quotationNo || 'Direct Payment', ML + boxW - 8, infoY + 16, { align: 'right' });
    pdf.text(companySettings?.name || 'Livoraa Atelier', ML + boxW - 8, infoY + 24, { align: 'right' });
    st(C.amtOrange);
    pdf.text(paymentMethod.toUpperCase() || '—', ML + boxW - 8, infoY + 34, { align: 'right' });

    // Billed To
    const bX = ML + boxW + 5;
    sf(C.offWhite); sd(C.lightGray); lw(0.2);
    pdf.roundedRect(bX, y, boxW, boxH, 1.5, 1.5, 'FD');
    sf(C.brownMid); pdf.rect(bX, y, 3, boxH, 'F');
    st(C.brownMid); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'bold');
    pdf.text('BILLED TO', bX + 8, y + 8);
    sd(C.lightGray); lw(0.1); pdf.line(bX + 8, y + 10, bX + boxW - 8, y + 10);

    const cust = currentCustomer;
    st(C.black); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
    pdf.text(clientName || '—', bX + 8, y + 18);
    st(C.midGray); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
    pdf.text(customerEmail || '—', bX + 8, y + 26);
    pdf.text(cust?.phone || customerPhone ? `+91 ${customerPhone || cust?.phone}` : '+91 —', bX + 8, y + 32);
    if (cust?.address) {
      const addr = `${cust.address.street}, ${cust.address.city}, ${cust.address.state}`.substring(0, 45);
      pdf.text(addr, bX + 8, y + 39);
      if (cust.address.pincode) {
        pdf.text(cust.address.pincode, bX + 8, y + 44);
      }
    }

    y += boxH + 12;

    // Items
    st(C.brown); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.text('Services & Ledger Description', ML, y);
    y += 5;

    const head = isDetailedView
      ? [['NO.', 'DESCRIPTION', 'QTY / SFT', 'PRICE', 'TOTAL']]
      : [['NO.', 'DESCRIPTION', 'AMOUNT']];

    const body = items.map((i, idx) => {
      if (isDetailedView) {
        return [
          String(idx + 1),
          i.description || '—',
          String(i.quantity || '-'),
          `Rs.${Number(i.price).toLocaleString('en-IN')}`,
          `Rs.${Number(i.amount).toLocaleString('en-IN')}.00`
        ];
      }
      return [
        String(idx + 1),
        i.description || '—',
        `Rs.${Number(i.amount).toLocaleString('en-IN')}.00`
      ];
    });

    const columnStyles = isDetailedView
      ? {
        0: { cellWidth: 15, halign: 'center' as const, fontStyle: 'bold' as const },
        1: { cellWidth: 'auto' as const, halign: 'left' as const },
        2: { cellWidth: 28, halign: 'center' as const },
        3: { cellWidth: 30, halign: 'right' as const },
        4: { cellWidth: 35, halign: 'right' as const, fontStyle: 'bold' as const, textColor: C.amtOrange }
      }
      : {
        0: { cellWidth: 15, halign: 'center' as const, fontStyle: 'bold' as const },
        1: { cellWidth: 'auto' as const, halign: 'left' as const },
        2: { cellWidth: 35, halign: 'right' as const, fontStyle: 'bold' as const, textColor: C.amtOrange }
      };

    autoTable(pdf, {
      startY: y,
      head: head,
      body: body,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 4,
        lineColor: C.brownDark,
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
        lineWidth: 0.15,
      },
      alternateRowStyles: { fillColor: C.offWhite },
      columnStyles: columnStyles as any,
      margin: { left: ML, right: MR },
      didParseCell: (data) => {
        if (data.section === 'head') {
          if (data.column.index === 1) data.cell.styles.halign = 'left';
          if (isDetailedView) {
            if (data.column.index === 3 || data.column.index === 4) data.cell.styles.halign = 'right';
          } else {
            if (data.column.index === 2) data.cell.styles.halign = 'right';
          }
        }
      }
    });

    y = (pdf as any).lastAutoTable.finalY + 12;

    // Total Paid Bar
    sf(C.brown); pdf.roundedRect(ML, y, CW, 20, 1.5, 1.5, 'F');
    st(C.white); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.text('TOTAL AMOUNT PAID', ML + 8, y + 8);
    pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
    pdf.text(`Payment received via ${paymentMethod || '—'}`, ML + 8, y + 14);

    pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
    pdf.text(`Rs.${totalAmount.toLocaleString('en-IN')}.00`, PW - MR - 8, y + 13, { align: 'right' });

    y += 28;

    // Important Notes
    sf(C.cream); sd(C.gold); lw(0.4);
    pdf.roundedRect(ML, y, CW, 28, 1.5, 1.5, 'FD');
    sf(C.brown); pdf.rect(ML, y, 4, 28, 'F');
    st(C.brown); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
    pdf.text('IMPORTANT NOTES', ML + 8, y + 8);
    st(C.darkGray); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
    const notes = [
      '- This receipt acknowledges the receipt of payment for the services mentioned above.',
      '- For any discrepancies, please contact our support within 48 hours of receipt generation.',
      '- Thank you for choosing LIVORAA ATELIER. We value your commitment.'
    ];
    notes.forEach((n, i) => pdf.text(n, ML + 8, y + 15 + i * 5));

    // Footer
    sf(C.gold); lw(0); pdf.rect(0, PH - 18, PW, 0.6, 'F');
    sf(C.brownDark); pdf.rect(0, PH - 17.4, PW, 17.4, 'F');

    // Main Thank You inside the bar
    st(C.white); pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
    pdf.text('Thank You for Your Business!', PW / 2, PH - 10, { align: 'center' });

    // Subtext inside the bar
    st(C.lightGray); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text('We appreciate your trust in LIVORAA ATELIER. Your satisfaction is our priority.', PW / 2, PH - 5, { align: 'center' });

    // Computer generated notice ABOVE the bar
    st(C.midGray); pdf.setFontSize(6.5); ital();
    pdf.text('This is a computer-generated receipt and is valid without signature.', PW / 2, PH - 21, { align: 'center' });

    function ital() { pdf.setFont('helvetica', 'italic'); }

    pdf.save(`Receipt-${receiptNo}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManualEntry && !selectedCustomer) { toast.warning('Please select a customer or enter details manually'); return; }
    if (isManualEntry && !clientName.trim()) { toast.warning('Please enter the customer name'); return; }
    if (!paymentMethod) { toast.warning('Please select a payment method'); return; }

    try {
      const data: any = {
        receiptNo,
        receiptDate,
        clientId: selectedCustomer || 'manual',
        clientName,
        customerEmail,
        customerPhone,
        items,
        total: totalAmount,
        paymentMethod,
        timestamp: Timestamp.now()
      };

      if (quotationNo) data.quotationNo = quotationNo;

      await addDoc(collection(db, 'receipts'), data);

      await createNotification(
        data.customerEmail,
        'Payment Receipt Generated',
        `A payment receipt (${data.receiptNo}) has been generated for your payment of ₹${data.total.toLocaleString()}.`,
        'payment_update',
        '/customer/dashboard'
      );

      generatePDF();
      toast.success('Receipt generated and saved!');
    } catch (err: any) {
      console.error('Error saving receipt:', err);
      toast.error(err.message || 'Error saving receipt');
    }
  };

  return (
    <div className="pb-16 max-w-5xl mx-auto">
      <ToastContainer position="bottom-right" />

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-500 rounded-[2.5rem] shadow-lg p-10 mb-10 flex items-center justify-between text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tight">Generate Receipt</h1>
          <p className="text-emerald-50 font-medium mt-2">Create professional receipts for your interior design services</p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-3 z-10">
          <div className="flex gap-2">
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-sm transition-all flex items-center gap-2">
              <CheckIcon className="w-4 h-4" /> Business Details
            </button>
          </div>
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/10 text-right">
            <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">LIVORAA ATELIER LLP</p>
            <p className="text-xs font-medium">Interior Design Studio</p>
          </div>
        </div>
        {/* Decorative Circles */}
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-700/20 rounded-full blur-2xl"></div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Receipt Info */}
        <Section title="Receipt Information" subtitle="Basic details about this transaction" icon={DocumentTextIcon}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelCls}>Receipt Number</label>
              <input
                className={inputCls}
                value={receiptNo}
                onChange={e => setReceiptNo(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Receipt Date</label>
              <input
                type="date"
                className={inputCls}
                value={receiptDate}
                onChange={e => setReceiptDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Quotation Number (Optional)</label>
              <div className="flex gap-3">
                <input
                  className={inputCls}
                  value={quotationNo}
                  onChange={e => setQuotationNo(e.target.value)}
                  placeholder="Enter quotation number"
                />
                <button
                  type="button"
                  onClick={loadQuotation}
                  disabled={isLoadingQuotation}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isLoadingQuotation ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ArrowPathIcon className="w-5 h-5" />}
                  Load
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* Customer Information */}
        <Section
          title="Customer Information"
          subtitle="Details of the client paying"
          icon={UserIcon}
          action={
            <button
              type="button"
              onClick={handleManualEntry}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isManualEntry ? 'bg-indigo-600 text-white' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
            >
              <PlusIcon className="w-4 h-4" /> Enter Manually
            </button>
          }
        >
          {!isManualEntry ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className={labelCls}>Select Customer *</label>
                  <div
                    onClick={() => setIsCustomerPopupOpen(true)}
                    className="w-full p-5 bg-gray-50 rounded-2xl font-bold text-gray-700 shadow-inner cursor-pointer flex items-center justify-between border-2 border-transparent hover:border-indigo-100 transition-all"
                  >
                    <span className={selectedCustomer ? 'text-gray-700' : 'text-gray-400'}>
                      {clientName || 'Click to select from database'}
                    </span>
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </div>

              {currentCustomer && (
                <div className="mt-8 p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CheckIcon className="w-4 h-4" /> Selected Customer Details:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Name:</span>
                      <span className="font-bold text-gray-700">{currentCustomer.name}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email:</span>
                      <span className="font-bold text-gray-700">{currentCustomer.email}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone:</span>
                      <span className="font-bold text-gray-700">{currentCustomer.phone}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">City:</span>
                      <span className="font-bold text-gray-700">{currentCustomer.address?.city || '—'}</span>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-1 pt-2 border-t border-indigo-100/30">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Address:</span>
                      <span className="font-bold text-gray-600 leading-relaxed italic">
                        {currentCustomer.address?.street}, {currentCustomer.address?.city}, {currentCustomer.address?.state} - {currentCustomer.address?.pincode}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 font-medium flex items-center gap-2">
                <PlusIcon className="w-4 h-4 shrink-0" />
                Entering customer details manually. These will be used on the receipt but not saved to the database.
                <button
                  type="button"
                  onClick={() => { setIsManualEntry(false); setClientName(''); setCustomerEmail(''); setCustomerPhone(''); }}
                  className="ml-auto text-xs font-bold text-amber-700 underline hover:no-underline"
                >
                  Switch to database
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input
                    className={inputCls}
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Customer full name"
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="customer@email.com"
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <div className="flex rounded-2xl overflow-hidden shadow-inner bg-gray-50 border-none">
                    <span className="flex items-center px-3 bg-gray-200 text-gray-600 font-semibold text-sm border-r border-gray-300 select-none whitespace-nowrap">+91</span>
                    <input
                      type="tel"
                      className="flex-1 p-4 bg-gray-50 focus:ring-0 outline-none font-bold text-gray-700"
                      value={customerPhone}
                      maxLength={10}
                      onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* Payment Method */}
        <Section title="Payment Method" subtitle="Choose how the payment was received" icon={CreditCardIcon}>
          <div className="relative">
            <select
              className={inputCls}
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
            >
              <option value="">Select Payment Method *</option>
              <option value="cash">Cash Payment</option>
              <option value="card">Credit/Debit Card</option>
              <option value="upi">UPI / GPay / PhonePe</option>
              <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </Section>

        {/* Receipt Items */}
        <Section
          title="Receipt Items"
          subtitle="What the client is paying for"
          icon={BanknotesIcon}
          action={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsDetailedView(!isDetailedView)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isDetailedView ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Detailed View {isDetailedView ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={addItem}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all"
              >
                <PlusIcon className="w-5 h-5" /> Add Item
              </button>
            </div>
          }
        >
          <div className="space-y-6">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 relative group">
                {/* Description - Now Full Width */}
                <div className="md:col-span-12">
                  <label className={labelCls}>Description</label>
                  <textarea
                    rows={2}
                    className={`${inputCls} resize-none min-h-[80px]`}
                    value={item.description}
                    onChange={e => updateItem(item.id, { description: e.target.value })}
                    placeholder={isDetailedView ? "E.g. Modular Kitchen with high-end finish and specialized hardware installation" : "E.g. Advance payment for Modular Kitchen design and material procurement"}
                  />
                </div>

                {/* Sub-fields Row */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-11 gap-6 items-end border-t border-gray-50 pt-4 mt-2">
                  {isDetailedView ? (
                    <>
                      <div className="md:col-span-3">
                        <label className={labelCls}>QTY / SFT</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={inputCls}
                          value={item.quantity}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              const price = Number(item.price) || 0;
                              const amt = val === '' ? 0 : Number(val) * price;
                              updateItem(item.id, { 
                                quantity: val, 
                                amount: String(Math.round(amt)) 
                              });
                            }
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className={labelCls}>Price</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`${inputCls} pl-8`}
                            value={item.price}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                const qty = Number(item.quantity) || 0;
                                const amt = val === '' ? 0 : Number(val) * qty;
                                updateItem(item.id, { 
                                  price: val, 
                                  amount: String(Math.round(amt)) 
                                });
                              }
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-4">
                        <label className={labelCls}>Total Amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`${inputCls} pl-8 font-black text-emerald-600`}
                            value={item.amount}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                updateItem(item.id, { amount: val });
                              }
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-10">
                      <label className={labelCls}>Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className={`${inputCls} pl-8`}
                          value={item.amount}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              updateItem(item.id, { amount: val });
                            }
                          }}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-1 flex justify-center pb-2">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-4 rounded-2xl transition-all"
                      >
                        <TrashIcon className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-8 bg-emerald-50 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 border border-emerald-100">
            <h3 className="text-xl font-black text-emerald-800 tracking-tight uppercase">Total Amount:</h3>
            <p className="text-4xl font-black text-emerald-600">₹{totalAmount.toLocaleString('en-IN')}.00</p>
          </div>
        </Section>

        {/* Generate Buttons */}
        <div className="mt-12 flex flex-col md:flex-row justify-center items-center gap-6">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-6 rounded-[2rem] text-xl font-black shadow-2xl shadow-emerald-100 hover:-translate-y-1 transition-all flex items-center gap-3 active:scale-95 w-full md:w-auto"
          >
            <CheckIcon className="w-8 h-8" />
            Generate & Download Receipt
          </button>

          <button
            type="button"
            onClick={generatePDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-6 rounded-[2rem] text-xl font-black shadow-2xl shadow-indigo-100 hover:-translate-y-1 transition-all flex items-center gap-3 active:scale-95 w-full md:w-auto"
          >
            <ArrowDownTrayIcon className="w-8 h-8" />
            Download PDF Only
          </button>
        </div>
      </form>

      {isCustomerPopupOpen && (
        <CustomerSearchPopup
          customers={customers}
          isOpen={isCustomerPopupOpen}
          onSelect={handleCustomerSelect}
          onClose={() => setIsCustomerPopupOpen(false)}
        />
      )}
    </div>
  );
};

export default ReceiptGenerator;
