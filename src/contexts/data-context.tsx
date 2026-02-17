
'use client';

import React, { createContext, useMemo, useCallback, useContext, ReactNode } from 'react';
import { Product, Customer, Supplier, Transaction, PurchaseItem, OrderItem, GameModality } from '@/lib/schemas';
import { UserProfile, useAuth } from './auth-context';
import { useToast } from "@/hooks/use-toast"; 
import { db } from '@/lib/firebase';
import { useCollection } from '@/hooks/use-collection';
import { addMonths, format } from 'date-fns';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';

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

const sanitizeData = (data: any) => {
  const sanitized = { ...data };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      sanitized[key] = null;
    }
  });
  return sanitized;
};

interface DataContextType {
  users: UserProfile[];
  products: Product[];
  gameModalities: GameModality[];
  suppliers: Supplier[];
  customers: Customer[];
  transactions: Transaction[];
  loading: boolean;
  saveProduct: (productData: Omit<Product, 'id'>, productId?: string) => Promise<string>;
  deleteProduct: (productId: string) => Promise<void>;
  saveGameModality: (data: Omit<GameModality, 'id'>, id?: string) => Promise<string>;
  deleteGameModality: (id: string) => Promise<void>;
  addStock: (productId: string, quantity: number, costPrice?: number) => Promise<void>;
  saveCustomer: (customerData: Omit<Customer, 'id' | 'balance'>, customerId?: string) => Promise<string>;
  deleteCustomer: (customerId: string) => Promise<void>;
  receiveCustomerPayment: (customer: Customer, amount: number, paymentMethod: string) => Promise<void>;
  saveSupplier: (supplierData: Omit<Supplier, 'id'>, supplierId?: string) => Promise<string>;
  deleteSupplier: (supplierId: string) => Promise<void>;
  recordPurchaseAndUpdateStock: (supplierId: string, supplierName: string, items: PurchaseItem[], totalCost: number) => Promise<void>;
  finalizeOrder: (
    order: {items: OrderItem[], total: number, displayName: string}, 
    customerId: string | null, 
    paymentMethod: string, 
    discount?: number, 
    customDate?: Date,
    gamePayout?: { productId: string, name: string, amount: number }
  ) => Promise<string>;
  addExpense: (description: string, amount: number, category: string, dateString: string, replicateMonths?: number) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  saveUserRole: (uid: string, role: 'admin' | 'cashier' | 'waiter') => Promise<void>;
  updateUserProfile: (uid: string, data: { name?: string; role?: 'admin' | 'cashier' | 'waiter' }) => Promise<void>;
  deleteUserProfile: (uid: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast(); 
  const { user, isAdmin } = useAuth();

  const usersQuery = useMemoFirebase(() => (db && user && isAdmin) ? collection(db, 'users') : null, [user, isAdmin]);
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const productsQuery = useMemoFirebase(() => (db && user) ? collection(db, 'products') : null, [user]);
  const { data: productsData, isLoading: productsLoading } = useCollection<Product>(productsQuery);

  const gameModalitiesQuery = useMemoFirebase(() => (db && user) ? collection(db, 'game_modalities') : null, [user]);
  const { data: gameModalitiesData, isLoading: gameModalitiesLoading } = useCollection<GameModality>(gameModalitiesQuery);

  const customersQuery = useMemoFirebase(() => (db && user) ? collection(db, 'customers') : null, [user]);
  const { data: customersData, isLoading: customersLoading } = useCollection<Customer>(customersQuery);

  const suppliersQuery = useMemoFirebase(() => (db && user) ? collection(db, 'suppliers') : null, [user]);
  const { data: suppliersData, isLoading: suppliersLoading } = useCollection<Supplier>(suppliersQuery);

  const transactionsQuery = useMemoFirebase(() => (db && user) ? query(collection(db, 'transactions'), orderBy('timestamp', 'desc')) : null, [user]);
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
    usersLoading || productsLoading || gameModalitiesLoading || customersLoading || suppliersLoading || transactionsLoading,
    [usersLoading, productsLoading, gameModalitiesLoading, customersLoading, suppliersLoading, transactionsLoading]
  );
  
  const saveProduct = async (data: Omit<Product, 'id'>, id?: string) => {
    const docRef = id ? doc(db, 'products', id) : doc(collection(db, 'products'));
    const payload = sanitizeData({ 
      ...data,
      name: data.name || '',
      updatedAt: serverTimestamp(),
      ...(!id && { createdAt: serverTimestamp() })
    });

    setDoc(docRef, payload, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: id ? 'update' : 'create',
        requestResourceData: payload
      }));
    });

    toast({ title: 'Sucesso', description: 'Produto processado no estoque.' });
    return docRef.id;
  };

  const deleteProduct = async (id: string) => {
    const docRef = doc(db, 'products', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });
    toast({ title: 'Sucesso', description: 'Produto removido.' });
  };

  const saveGameModality = async (data: Omit<GameModality, 'id'>, id?: string) => {
    const docRef = id ? doc(db, 'game_modalities', id) : doc(collection(db, 'game_modalities'));
    const payload = sanitizeData({ 
      ...data,
      updatedAt: serverTimestamp(),
      ...(!id && { createdAt: serverTimestamp() })
    });

    setDoc(docRef, payload, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: id ? 'update' : 'create',
        requestResourceData: payload
      }));
    });

    toast({ title: 'Banca Atualizada', description: 'Modalidade de jogo salva.' });
    return docRef.id;
  };

  const deleteGameModality = async (id: string) => {
    const docRef = doc(db, 'game_modalities', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });
    toast({ title: 'Removido', description: 'Modalidade excluída da banca.' });
  };

  const addStock = async (id: string, qty: number, cost?: number) => {
    const docRef = doc(db, 'products', id);
    updateDoc(docRef, { 
      stock: increment(qty), 
      ...(cost && { costPrice: cost }),
      updatedAt: serverTimestamp()
    }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'update'
      }));
    });
    toast({ title: 'Sucesso', description: 'Estoque atualizado.' });
  };

  const saveCustomer = async (data: Omit<Customer, 'id' | 'balance'>, id?: string) => {
    const docRef = id ? doc(db, 'customers', id) : doc(collection(db, 'customers'));
    const payload = sanitizeData({ 
      ...data,
      name: data.name || '',
      updatedAt: serverTimestamp(),
      ...(!id && { balance: 0, createdAt: serverTimestamp() })
    });

    setDoc(docRef, payload, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: id ? 'update' : 'create',
        requestResourceData: payload
      }));
    });

    toast({ title: 'Sucesso', description: 'Perfil de cliente atualizado.' });
    return docRef.id;
  };

  const deleteCustomer = async (id: string) => {
    const docRef = doc(db, 'customers', id);
    deleteDoc(docRef).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });
    toast({ title: 'Removido', description: 'Cliente excluído do sistema.' });
  };

  const receiveCustomerPayment = async (customer: Customer, amount: number, paymentMethod: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const customerRef = doc(db, 'customers', customer.id!);
        const paymentRef = doc(collection(db, 'transactions'));
        transaction.update(customerRef, { balance: increment(-amount), updatedAt: serverTimestamp() });
        transaction.set(paymentRef, sanitizeData({
          id: paymentRef.id,
          timestamp: serverTimestamp(),
          type: 'payment',
          description: `Recebimento: ${customer.name}`,
          total: amount,
          paymentMethod,
          customerId: customer.id,
          items: [],
          userId: user?.uid || null,
        }));
      });
      toast({ title: 'Confirmado', description: 'Pagamento abatido do saldo.' });
    } catch (e) {
      console.error("Payment transaction failed", e);
    }
  };

  const saveSupplier = async (data: Omit<Supplier, 'id'>, id?: string) => {
    const docRef = id ? doc(db, 'suppliers', id) : doc(collection(db, 'suppliers'));
    const payload = sanitizeData({ ...data, updatedAt: serverTimestamp() });
    
    setDoc(docRef, payload, { merge: true }).catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: id ? 'update' : 'create'
      }));
    });
    return docRef.id;
  };

  const deleteSupplier = async (id: string) => {
    await deleteDoc(doc(db, 'suppliers', id));
    toast({ title: 'Removido', description: 'Fornecedor excluído.' });
  };

  const recordPurchaseAndUpdateStock = async (supplierId: string, supplierName: string, items: PurchaseItem[], totalCost: number) => {
    const batch = writeBatch(db);
    const purchaseRef = doc(collection(db, 'purchases'));
    const expenseRef = doc(collection(db, 'transactions'));
    
    batch.set(purchaseRef, sanitizeData({ id: purchaseRef.id, supplierId, supplierName, items, totalCost, createdAt: serverTimestamp() }));
    batch.set(expenseRef, sanitizeData({ id: expenseRef.id, timestamp: serverTimestamp(), type: 'expense', description: `Compra: ${supplierName}`, total: totalCost, expenseCategory: 'Insumos', items, supplierId, userId: user?.uid || null }));
    
    items.forEach(item => {
      batch.update(doc(db, 'products', item.productId), { 
        stock: increment(item.quantity), 
        costPrice: item.unitCost,
        updatedAt: serverTimestamp() 
      });
    });
    
    await batch.commit();
    toast({ title: 'Sucesso', description: 'Compra registrada e estoque reposto.' });
  };

  const finalizeOrder = async (
    order: {items: OrderItem[], total: number, displayName: string}, 
    customerId: string | null, 
    paymentMethod: string, 
    discount: number = 0, 
    customDate?: Date,
    gamePayout?: { productId: string, name: string, amount: number }
  ) => {
    const payoutAmount = gamePayout?.amount || 0;
    const finalTotal = Math.max(0, order.total - discount - payoutAmount);
    const saleDate = customDate || new Date();
    
    try {
      await runTransaction(db, async (t) => {
        const saleRef = doc(collection(db, 'transactions'));
        
        // Atualiza estoque apenas para itens de bar (produtos)
        order.items.forEach(item => {
          // Só subtrai estoque se o item não for de uma modalidade de jogo
          const isGame = gameModalitiesData?.some(gm => gm.id === item.productId);
          if (!isGame) {
            const dec = item.size ? item.size * item.quantity : item.quantity;
            t.update(doc(db, 'products', item.productId), { stock: increment(-dec), updatedAt: serverTimestamp() });
          }
        });

        if (paymentMethod === 'Fiado' && customerId) {
          t.update(doc(db, 'customers', customerId), { balance: increment(finalTotal), updatedAt: serverTimestamp() });
        }

        const finalItems = [...order.items];
        if (gamePayout && gamePayout.amount > 0) {
          finalItems.push({
            productId: gamePayout.productId,
            name: `ABATE PRÊMIO: ${gamePayout.name}`,
            quantity: 1,
            unitPrice: -gamePayout.amount,
            identifier: 'PAGAMENTO_PREMIO'
          });
        }

        t.set(saleRef, sanitizeData({ 
          id: saleRef.id, 
          timestamp: saleDate, 
          type: 'sale', 
          description: `Venda ${order.displayName}`, 
          total: finalTotal, 
          discount: discount,
          items: finalItems, 
          paymentMethod, 
          customerId, 
          tabName: order.displayName, 
          userId: user?.uid || null 
        }));
      });
      toast({ title: 'Finalizado', description: 'Venda enviada para o BI Cockpit.' });
      return "success";
    } catch (e) {
      console.error("Finalize error", e);
      throw e;
    }
  };
  
  const addExpense = async (description: string, amount: number, category: string, dateString: string, replicateMonths: number = 0) => {
    const batch = writeBatch(db);
    const baseDate = new Date(dateString + 'T12:00:00');
    for (let i = 0; i <= replicateMonths; i++) {
      const expenseRef = doc(collection(db, 'transactions'));
      const currentDate = addMonths(baseDate, i);
      batch.set(expenseRef, sanitizeData({ id: expenseRef.id, timestamp: currentDate, type: 'expense', description: i === 0 ? description : `${description} - ${format(currentDate, 'MM/yy')}`, total: amount, expenseCategory: category, items: [], userId: user?.uid || null }));
    }
    await batch.commit();
    toast({ title: 'Sucesso', description: 'Despesa registrada.' });
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
    toast({ title: 'Sucesso', description: 'Transação anulada.' });
  };

  const saveUserRole = async (uid: string, role: 'admin' | 'cashier' | 'waiter') => {
    await setDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() }, { merge: true });
  };

  const updateUserProfile = async (uid: string, data: { name?: string; role?: 'admin' | 'cashier' | 'waiter' }) => {
    const payload = sanitizeData(data);
    await setDoc(doc(db, 'users', uid), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    toast({ title: 'Sucesso', description: 'Perfil atualizado.' });
  };

  const deleteUserProfile = async (uid: string) => {
    await deleteDoc(doc(db, 'users', uid));
    toast({ title: 'Revogado', description: 'Acesso removido.' });
  };

  const value = {
    users: usersData || [], products: productsData || [], gameModalities: gameModalitiesData || [], customers: customersData || [], suppliers: suppliersData || [], transactions: transactionsData || [],
    loading, saveProduct, deleteProduct, saveGameModality, deleteGameModality, addStock, saveCustomer, deleteCustomer, receiveCustomerPayment, saveSupplier, deleteSupplier, recordPurchaseAndUpdateStock, finalizeOrder, addExpense, deleteTransaction, saveUserRole, updateUserProfile, deleteUserProfile
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
