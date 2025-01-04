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
  room: string;
  item: string;
  d1: number;
  d2: number;
  type: string;
  area: number;
  price: number;
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
