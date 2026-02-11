// src/lib/schemas.ts

import { FieldValue } from 'firebase/firestore';

// Base para documentos do Firestore com ID e timestamps
interface FirestoreDocument {
  id?: string;
  createdAt?: FieldValue | Date;
  updatedAt?: FieldValue | Date;
}

export interface Product extends FirestoreDocument {
  name: string;
  category: string;
  costPrice: number;
  unitPrice: number;
  stock: number;
  saleType: 'unit' | 'dose' | 'service';
}

export interface Customer extends FirestoreDocument {
  name: string;
  balance: number; // Saldo devedor (para fiado)
  contact?: string;
}

export interface Supplier extends FirestoreDocument {
  name: string;
  contact?: string;
  cnpj?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  size?: number; // Para produtos vendidos por dose/tamanho
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number; // Custo unitário na compra
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

// UserProfile já está definido em auth-context.tsx, mas pode ser re-exportado aqui se preferir
// export interface UserProfile extends DocumentData {
//   name?: string;
//   email?: string;
//   role?: 'admin' | 'waiter' | 'manager';
//   createdAt?: FieldValue | Date;
//   lastLogin?: FieldValue | Date;
// }

// Se você tiver outras entidades como OpenOrder, elas também deveriam estar aqui.
// OpenOrder já está no backend.json, mas a interface TypeScript seria:
// export interface OpenOrder extends FirestoreDocument {
//   tableNumber: string;
//   status: 'open' | 'pending_payment' | 'closed';
//   items: OrderItem[];
//   totalAmount: number;
//   openedAt: FieldValue | Date;
//   waiterId?: string;
// }