export interface ProjectWorker {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  contactNumber: string;
  assignedTasks?: string[];
  status: 'active' | 'inactive';
}

export interface PaymentHistory {
  amount: number;
  date: string;
  type: 'advance' | 'installment' | 'final';
  notes?: string;
  paymentMethod: 'cash' | 'bank' | 'upi';
  transactionId?: string;
  status: 'success' | 'pending' | 'failed';
}

export interface PaymentSchedule {
  dueDate: string;
  expectedAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
  installmentNumber: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface QuotationItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  isLumpsum: boolean;
  price: number;
  area: number;
  type: string;
  item: string;
  room: string;
  d1?: number;
  d2?: number;
}

export interface Quotation {
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

export interface Project {
  id: string;
  title: string;
  client: string;
  clientEmail: string;
  clientPhone: string;
  status: string;
  description: string;
  location: string;
  budget: number;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  payments: {
    totalAmount: number;
    advanceAmount: number;
    remainingAmount: number;
    paymentStatus: string;
    nextPaymentDate: string;
    paymentHistory: PaymentHistory[];
    paymentSchedule: PaymentSchedule[];
  };
  workers?: ProjectWorker[];
}
