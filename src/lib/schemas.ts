
import { FieldValue } from 'firebase/firestore';

export interface DoseOption {
  name: string;
  size: number;
  price: number;
  enabled: boolean;
}

export interface Product {
  id?: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  costPrice: number;
  unitPrice: number;
  stock: number;
  lowStockThreshold?: number | null;
  saleType: 'unit' | 'dose' | 'service' | 'portion' | 'weight' | 'game';
  doseOptions?: DoseOption[];
  baseUnitSize?: number | null;
  createdAt?: FieldValue | Date;
  updatedAt?: FieldValue | Date;
}

export interface GameModality {
  id?: string;
  name: string;
  category: string;
  subcategory?: string;
  unitPrice: number; // Suggested value
  createdAt?: FieldValue | Date;
  updatedAt?: FieldValue | Date;
}

export interface Customer {
  id?: string;
  name: string;
  contact?: string;
  balance: number;
  creditLimit?: number | null;
  createdAt?: FieldValue | Date;
  updatedAt?: FieldValue | Date;
}

export interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  cnpj?: string;
  createdAt?: FieldValue | Date;
  updatedAt?: FieldValue | Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  size?: number; 
  doseName?: string; 
  subcategory?: string;
  identifier?: string; // Campo para Milhar, Nº Cartela, ID Máquina
}

export interface Order {
  id?: string;
  displayName: string;
  customerId: string | null;
  items: OrderItem[];
  total: number;
  status: 'open' | 'pending_payment' | 'closed';
  createdAt?: FieldValue | Date;
  closedAt?: FieldValue | Date | null;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number; 
}

export interface Purchase {
  id?: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalCost: number;
  createdAt: FieldValue | Date;
}

export interface Transaction {
  id?: string;
  type: 'sale' | 'expense' | 'payment';
  total: number;
  discount?: number;
  timestamp: FieldValue | Date;
  orderCreatedAt?: FieldValue | Date | null; // Novo campo para rastrear duração operacional
  description?: string;
  paymentMethod?: string; 
  customerId?: string; 
  supplierId?: string; 
  expenseCategory?: string; 
  items?: (OrderItem | PurchaseItem)[]; 
  tabName?: string; 
  userId?: string | null; 
}
