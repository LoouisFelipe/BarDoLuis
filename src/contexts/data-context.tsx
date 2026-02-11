'use client';

import React, { createContext, useMemo, useCallback, useContext, ReactNode } from 'react';
import { Product, Customer, Supplier, Transaction, PurchaseItem, OrderItem } from '@/lib/schemas';
import { UserProfile, useAuth } from './auth-context';
// ✅ Importação corrigida do Toast
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addMonths, format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// 🚨 ESTAVA FALTANDO ESTE BLOCO DE IMPORTAÇÕES DO FIREBASE:
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  runTransaction, 
  writeBatch, 
  query, 
  orderBy 
} from 'firebase/firestore';

interface DataContextType {
  users: UserProfile[];
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  loading: boolean;
  
  saveProduct: (productData: Omit<Product, 'id'>, productId?: string) => Promise<string>;
  deleteProduct: (productId: string) => Promise<void>;
  addStock: (productId: string, quantity: number, costPrice?: number) => Promise<void>;

  saveCustomer: (customerData: Omit<Customer, 'id' | 'balance'>, customerId?: string) => Promise<string>;
  deleteCustomer: (customerId: string) => Promise<void>;
  receiveCustomerPayment: (customer: Customer, amount: number, paymentMethod: string) => Promise<void>;
  
  saveSupplier: (supplierData: Omit<Supplier, 'id'>, supplierId?: string) => Promise<string>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  recordPurchaseAndUpdateStock: (supplierId: string, supplierName: string, items: PurchaseItem[], totalCost: number) => Promise<void>;
  
  finalizeOrder: (order: {items: OrderItem[], total: number, displayName: string}, customerId: string | null, paymentMethod: string) => Promise<string>;
  addExpense: (description: string, amount: number, category: string, dateString: string, replicateMonths?: number) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  
  saveUserRole: (uid: string, role: 'admin' | 'cashier' | 'waiter') => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast(); 
  const db = useFirestore(); 
  const { user, isAdmin } = useAuth();

  // Queries Memoizadas vinculadas à instância 'bardoluis'
  const usersQuery = useMemoFirebase(() => (db && user && isAdmin) ? collection(db, 'users') : null, [db, user, isAdmin]);
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const productsQuery = useMemoFirebase(() => (db && user) ? collection(db, 'products') : null, [db, user]);
  const { data: productsData, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  const customersQuery = useMemoFirebase(() => (db && user) ? collection(db, 'customers') : null, [db, user]);
  const { data: customersData, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

  const suppliersQuery = useMemoFirebase(() => (db && user) ? collection(db, 'suppliers') : null, [db, user]);
  const { data: suppliersData, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersQuery);

  const transactionsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'transactions'), orderBy('timestamp', 'desc')) : null, [db, user]);
  const { data: rawTransactionsData, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const transactionsData = useMemo(() => {
    if (!rawTransactionsData) return [];
    return rawTransactionsData.map(t => {
      let dateValue: Date;
      if (t.timestamp instanceof Date) dateValue = t.timestamp;
      else if (t.timestamp && (t.timestamp as any).toDate) dateValue = (t.timestamp as any).toDate();
      else dateValue = new Date(); 
      return { ...t, timestamp: dateValue };
    });
  }, [rawTransactionsData]);

  const loading = useMemo(() => 
    usersLoading || productsLoading || customersLoading || suppliersLoading || transactionsLoading,
    [usersLoading, productsLoading, customersLoading, suppliersLoading, transactionsLoading]
  );
  
  const handleAction = useCallback(async <T,>(
    action: () => Promise<T>,
    successMessage: string,
    operation: 'write' | 'create' | 'update' | 'delete',
    path: string,
    data?: any
  ): Promise<T> => {
    try {
      const result = await action();
      toast({ title: 'Sucesso!', description: successMessage });
      return result;
    } catch (e: any) {
      console.error("Erro na ação:", e); // Log útil para debug
      const permissionError = new FirestorePermissionError({
        path,
        operation,
        requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw e;
    }
  }, [toast]);

  // Mutations
  const saveProduct = (data: Omit<Product, 'id'>, id?: string) => 
    handleAction(async () => {
      if (!db) throw new Error("Firestore não inicializado");
      const docRef = id ? doc(db, 'products', id) : doc(collection(db, 'products'));
      await setDoc(docRef, { ...data, updatedAt: serverTimestamp(), createdAt: id ? undefined : serverTimestamp() }, { merge: true });
      return docRef.id;
    }, 'Produto salvo.', id ? 'update' : 'create', 'products', data);

  const deleteProduct = (id: string) => 
    handleAction(async () => {
      if (!db) throw new Error("Firestore não inicializado");
      await deleteDoc(doc(db, 'products', id));
    }, 'Produto excluído.', 'delete', `products/${id}`);

  const addStock = (id: string, qty: number, cost?: number) =>
    handleAction(async () => {
      if (!db) throw new Error("Firestore não inicializado");
      await updateDoc(doc(db, 'products', id), { stock: increment(qty), ...(cost && { costPrice: cost }) });
    }, 'Estoque atualizado.', 'update', `products/${id}`);

  const saveCustomer = (data: Omit<Customer, 'id' | 'balance'>, id?: string) => 
    handleAction(async () => {
      if (!db) throw new Error("Firestore não inicializado");
      const docRef = id ? doc(db, 'customers', id) : doc(collection(db, 'customers'));
      await setDoc(docRef, { ...data, balance: id ? undefined : 0, updatedAt: serverTimestamp() }, { merge: true });
      return docRef.id;
    }, 'Cliente salvo.', id ? 'update' : 'create', 'customers', data);

  const deleteCustomer = (id: string) => 
    handleAction(async () => {
      if (!db) throw new Error("Firestore não inicializado");
      await deleteDoc(doc(db, 'customers', id));
    }, 'Cliente excluído.', 'delete', `customers/${id}`);

  const receiveCustomerPayment = (customer: Customer, amount: number, paymentMethod: string) =>
    handleAction(async () => {
        if (!db) throw new Error("Firestore não inicializado");
        await runTransaction(db, async (transaction) => {
            const customerRef = doc(db, 'customers', customer.id!);
            const paymentRef = doc(collection(db, 'transactions'));
            
            // Verifica se o cliente ainda existe antes de abater
            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) throw new Error("Cliente não encontrado!");

            transaction.update(customerRef, { balance: increment(-amount) });
            transaction.set(paymentRef, {
                id: paymentRef.id,
                timestamp: serverTimestamp(),
                type: 'payment',
                description: `Recebimento de ${customer.name}`,
                total: amount,
                paymentMethod,
                customerId: customer.id,
                items: [],
                userId: user?.uid || null,
            });
        });
    }, 'Pagamento recebido.', 'write', 'transactions');

  const saveSupplier = (data: Omit<Supplier, 'id'>, id?: string) =>
    handleAction(async () => {
      if (!db) throw new Error("Firestore não inicializado");
      const docRef = id ? doc(db, 'suppliers', id) : doc(collection(db, 'suppliers'));
      await setDoc(docRef, data, { merge: true });
      return docRef.id;
    }, 'Fornecedor salvo.', id ? 'update' : 'create', 'suppliers', data);

  const deleteSupplier = (id: string) =>
    handleAction(async () => {
      if (!db) throw new Error("Firestore não inicializado");
      await deleteDoc(doc(db, 'suppliers', id));
    }, 'Fornecedor excluído.', 'delete', `suppliers/${id}`);

  const recordPurchaseAndUpdateStock = (supplierId: string, supplierName: string, items: PurchaseItem[], totalCost: number) =>
    handleAction(async () => {
        if (!db) throw new Error("Firestore não inicializado");
        const batch = writeBatch(db);
        const purchaseRef = doc(collection(db, 'purchases'));
        const expenseRef = doc(collection(db, 'transactions'));
        batch.set(purchaseRef, { id: purchaseRef.id, supplierId, supplierName, items, totalCost, createdAt: serverTimestamp() });
        batch.set(expenseRef, { id: expenseRef.id, timestamp: serverTimestamp(), type: 'expense', description: `Compra: ${supplierName}`, total: totalCost, expenseCategory: 'Insumos', items, supplierId, userId: user?.uid || null });
        items.forEach(item => {
            batch.update(doc(db, 'products', item.productId), { stock: increment(item.quantity), costPrice: item.unitCost });
        });
        await batch.commit();
    }, 'Compra registrada.', 'write', 'purchases');

  const finalizeOrder = (order: {items: OrderItem[], total: number, displayName: string}, customerId: string | null, paymentMethod: string) =>
    handleAction(async () => {
        if (!db) throw new Error("Firestore não inicializado");
        return runTransaction(db, async (t) => {
            const saleRef = doc(collection(db, 'transactions'));
            order.items.forEach(item => {
                const dec = item.size ? item.size * item.quantity : item.quantity;
                t.update(doc(db, 'products', item.productId), { stock: increment(-dec) });
            });
            if (paymentMethod === 'Fiado' && customerId) {
                t.update(doc(db, 'customers', customerId), { balance: increment(order.total) });
            }
            t.set(saleRef, { id: saleRef.id, timestamp: serverTimestamp(), type: 'sale', description: `Venda ${order.displayName}`, total: order.total, items: order.items, paymentMethod, customerId, tabName: order.displayName, userId: user?.uid || null });
            return saleRef.id;
        });
    }, 'Venda finalizada.', 'write', 'transactions');
  
  const addExpense = (description: string, amount: number, category: string, dateString: string, replicateMonths: number = 0) =>
    handleAction(async () => {
        if (!db) throw new Error("Firestore não inicializado");
        const batch = writeBatch(db);
        const baseDate = new Date(dateString + 'T12:00:00');
        for (let i = 0; i <= replicateMonths; i++) {
            const expenseRef = doc(collection(db, 'transactions'));
            const currentDate = addMonths(baseDate, i);
            batch.set(expenseRef, { id: expenseRef.id, timestamp: currentDate, type: 'expense', description: i === 0 ? description : `${description} - ${format(currentDate, 'MM/yy')}`, total: amount, expenseCategory: category, items: [], userId: user?.uid || null });
        }
        await batch.commit();
    }, 'Despesa registrada.', 'write', 'transactions');

  const deleteTransaction = (id: string) =>
    handleAction(async () => {
      if (!db) throw new Error("Firestore não inicializado");
      await deleteDoc(doc(db, 'transactions', id));
    }, 'Transação excluída.', 'delete', `transactions/${id}`);

  const saveUserRole = (uid: string, role: 'admin' | 'cashier' | 'waiter') =>
    handleAction(async () => {
      if (!db) throw new Error("Firestore não inicializado");
      await setDoc(doc(db, 'users', uid), { role }, { merge: true });
    }, 'Cargo atualizado.', 'update', `users/${uid}`);

  const value = {
    users: usersData || [], products: productsData || [], customers: customersData || [], suppliers: suppliersData || [], transactions: transactionsData || [],
    loading, saveProduct, deleteProduct, addStock, saveCustomer, deleteCustomer, receiveCustomerPayment, saveSupplier, deleteSupplier, recordPurchaseAndUpdateStock, finalizeOrder, addExpense, deleteTransaction, saveUserRole
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
// Atualização forçada para o Git
