// src/lib/schemas.ts

import { FieldValue } from 'firebase/firestore';

// Base para documentos do Firestore com ID e timestamps
interface FirestoreDocument {
  id?: string;
  createdAt?: FieldValue | Date;
  updatedAt?: FieldValue | Date;
}

export interface DoseOption {
  name: string;
  size: number;
  price: number;
  enabled: boolean;
}

export interface Product extends FirestoreDocument {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  costPrice: number;
  unitPrice: number;
  stock: number;
  lowStockThreshold?: number | null;
  saleType: 'unit' | 'dose' | 'service';
  doseOptions?: DoseOption[];
  baseUnitSize?: number | null;
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

export interface Supplier extends FirestoreDocument {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  cnpj?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  size?: number; // Para produtos vendidos por dose/tamanho
  doseName?: string; // Nome da dose (ex: "Dose 50ml")
  subcategory?: string;
  identifier?: string;
}

export interface Order extends FirestoreDocument {
  displayName: string;
  customerId: string | null;
  items: OrderItem[];
  total: number;
  status: 'open' | 'pending_payment' | 'closed';
  closedAt?: FieldValue | Date | null;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number; // Custo unitário na compra
}

export interface Purchase extends FirestoreDocument {
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalCost: number;
}

export interface Transaction extends FirestoreDocument {
  type: 'sale' | 'expense' | 'payment';
  total: number;
  timestamp: FieldValue | Date;
  description?: string;
  paymentMethod?: string; // Para vendas e pagamentos
  customerId?: string; // Para vendas e pagamentos de clientes
  supplierId?: string; // Para despesas de fornecedores
  expenseCategory?: string; // Para despesas
  items?: OrderItem[] | PurchaseItem[]; // Itens da transação (venda ou compra)
  tabName?: string; // Nome da comanda/mesa (para vendas)
  userId?: string | null; // Usuário que realizou a transação
}
