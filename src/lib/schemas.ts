/**
 * @fileoverview Definições de tipos e interfaces para o sistema de PDV BARDOLUIS.
 */
import { FieldValue, Timestamp } from 'firebase/firestore'; // CTO Rule: Import FieldValue and Timestamp

export interface Product {
  id?: string;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  costPrice: number;
  unitPrice: number;
  stock: number;
  lowStockThreshold: number | null;
  saleType: 'unit' | 'dose' | 'service';
  doseOptions?: DoseOption[];
  baseUnitSize?: number | null;
}

export interface DoseOption {
  name: string;
  size: number;
  price: number;
  enabled: boolean;
}

export interface Customer {
  id?: string; // CFO Rule: ID can be optional on creation
  name: string;
  contact?: string;
  balance: number;
  creditLimit: number | null;
  createdAt?: Date | FieldValue | Timestamp; // CTO Rule: Allow FieldValue/Timestamp for creation and Date for read
  updatedAt?: Date | FieldValue | Timestamp; // CTO Rule: Allow FieldValue/Timestamp for creation and Date for read
}

export interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Transaction {
  id: string;
  timestamp: Date | FieldValue | Timestamp;
  type: 'sale' | 'expense' | 'payment';
  description: string;
  total: number;
  items: any[]; // TabItem[]
  paymentMethod?: string;
  customerId?: string;
  supplierId?: string;
  expenseCategory?: string;
  tabName?: string;
  userId?: string;
}

export interface TabItem {
  identifier: string;
  productId: string;
  name: string;
  subcategory?: string | null;
  type: 'unit' | 'dose' | 'service';
  price: number;
  quantity: number;
  size?: number | null;
  doseName?: string | null;
  baseUnitSize?: number | null;
  comboItems?: any[];
}

export interface Purchase {
    id: string;
    supplierId: string;
    supplierName: string;
    items: PurchaseItem[];
    totalCost: number;
    createdAt: Date | FieldValue | Timestamp;
}

export interface PurchaseItem {
    productId: string;
    name: string;
    quantity: number;
    unitCost: number;
}

export interface CustomerInsightsOutput {
    customerSummary: {
        mainStorePreference: string;
        favoriteProduct: string;
        purchaseFrequency: string;
        averageTicket: number;
    };
    marketingSuggestions: string[];
}

// Represents an item within an open order/tab
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  doseName?: string;
  size?: number;
}

// Represents an open order/tab (e.g., a table)
export interface Order {
  id: string; // e.g., "table-1"
  displayName: string; // e.g., "Table 1"
  status: 'open' | 'closed';
  items: OrderItem[];
  total: number;
  createdAt: Date | FieldValue | Timestamp;
  closedAt?: Date | FieldValue | Timestamp | null;
  customerId?: string | null;
}
