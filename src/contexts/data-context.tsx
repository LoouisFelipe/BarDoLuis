'use client';

import { createContext, useMemo, useCallback, useContext } from 'react';
import { Product, Customer, Supplier, Transaction, PurchaseItem, OrderItem } from '@/lib/schemas';
import { UserProfile, useAuth } from './auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  increment,
  writeBatch,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addMonths, format } from 'date-fns';

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

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useAuth();

  const usersQuery = useMemoFirebase(() => (db && user) ? collection(db, 'users') : null, [db, user]);
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
      if (t.timestamp instanceof Date) {
        dateValue = t.timestamp;
      } else if (t.timestamp && typeof (t.timestamp as any).toDate === 'function') {
        dateValue = (t.timestamp as any).toDate();
      } else {
        dateValue = new Date(); 
      }
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
    errorMessage: string,
    context?: { path: string, operation: 'create' | 'update' | 'delete' | 'write', data?: any }
  ): Promise<T> => {
    try {
      const result = await action();
      toast({ title: 'Sucesso!', description: successMessage });
      return result;
    } catch (e: any) {
      if (e.code === 'permission-denied' && context) {
        const permissionError = new FirestorePermissionError({
          path: context.path,
          operation: context.operation,
          requestResourceData: context.data,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      }
      toast({ title: 'Erro!', description: `${errorMessage}: ${e.message}`, variant: 'destructive' });
      throw e;
    }
  }, [toast]);
  
  const genericSave = useCallback(async <T extends object>(path: string, data: T, id?: string): Promise<string> => {
    if (!db) throw new Error("Firestore not initialized");
    const collectionRef = collection(db, path);
    const docRef = id ? doc(collectionRef, id) : doc(collectionRef);
    
    // Limpeza profunda: garante que não enviamos undefined nem o próprio ID dentro do corpo do documento
    const cleanData: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        cleanData[key] = value ?? null;
      }
    });
    
    const finalData = { 
        ...cleanData, 
        updatedAt: serverTimestamp(), 
        ...(!id && { createdAt: serverTimestamp() }) 
    };
    
    await setDoc(docRef, JSON.parse(JSON.stringify(finalData)), { merge: true });
    return docRef.id;
  }, [db]);

  const saveProduct = (productData: Omit<Product, 'id'>, productId?: string) => 
    handleAction(
      () => genericSave('products', productData, productId), 
      'Produto salvo.', 
      'Falha ao salvar produto.',
      { path: `products`, operation: productId ? 'update' : 'create', data: productData }
    );

  const deleteProduct = (productId: string) => 
    handleAction(
      () => deleteDoc(doc(db, 'products', productId)), 
      'Produto excluído.', 
      'Falha ao excluir produto.',
      { path: `products/${productId}`, operation: 'delete' }
    );

  const addStock = (productId: string, quantity: number, costPrice?: number) =>
    handleAction(async () => {
      if (!db) throw new Error("Firestore not initialized");
      const productRef = doc(db, 'products', productId);
      const updateData: any = { stock: increment(quantity) };
      if (costPrice !== undefined) updateData.costPrice = costPrice;
      await updateDoc(productRef, updateData);
    }, 'Estoque atualizado.', 'Falha ao atualizar estoque.');

  const saveCustomer = (customerData: Omit<Customer, 'id' | 'balance'>, customerId?: string) => 
    handleAction(
      () => {
        const data = customerId ? customerData : { ...customerData, balance: 0 };
        return genericSave('customers', data, customerId);
      }, 
      'Cliente salvo.', 
      'Falha ao salvar cliente.',
      { path: `customers`, operation: customerId ? 'update' : 'create', data: customerData }
    );

  const deleteCustomer = (customerId: string) => 
    handleAction(
      () => deleteDoc(doc(db, 'customers', customerId)), 
      'Cliente excluído.', 
      'Falha ao excluir cliente.',
      { path: `customers/${customerId}`, operation: 'delete' }
    );

  const receiveCustomerPayment = (customer: Customer, amount: number, paymentMethod: string) =>
    handleAction(async () => {
        if (!db) throw new Error("Firestore not initialized");
        await runTransaction(db, async (transaction) => {
            const customerRef = doc(db, 'customers', customer.id!);
            const paymentRef = doc(collection(db, 'transactions'));
            
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
    }, 'Pagamento recebido.', 'Falha ao receber pagamento.');

  const saveSupplier = (supplierData: Omit<Supplier, 'id'>, supplierId?: string) =>
    handleAction(
      () => genericSave('suppliers', supplierData, supplierId), 
      'Fornecedor salvo.', 
      'Falha ao salvar fornecedor.',
      { path: `suppliers`, operation: supplierId ? 'update' : 'create', data: supplierData }
    );

  const deleteSupplier = (supplierId: string) =>
    handleAction(
      () => deleteDoc(doc(db, 'suppliers', supplierId)), 
      'Fornecedor excluído.', 
      'Falha ao excluir fornecedor.',
      { path: `suppliers/${supplierId}`, operation: 'delete' }
    );

  const recordPurchaseAndUpdateStock = (supplierId: string, supplierName: string, items: PurchaseItem[], totalCost: number) =>
    handleAction(async () => {
        if (!db) throw new Error("Firestore not initialized");
        const batch = writeBatch(db);
        const purchaseRef = doc(collection(db, 'purchases'));
        const expenseRef = doc(collection(db, 'transactions'));

        batch.set(purchaseRef, {
            id: purchaseRef.id,
            supplierId,
            supplierName,
            items: JSON.parse(JSON.stringify(items)),
            totalCost,
            createdAt: serverTimestamp(),
        });

        batch.set(expenseRef, {
            id: expenseRef.id,
            timestamp: serverTimestamp(),
            type: 'expense',
            description: `Compra de Fornecedor: ${supplierName}`,
            total: totalCost,
            expenseCategory: 'Insumos',
            items: JSON.parse(JSON.stringify(items)),
            supplierId,
        });

        for (const item of items) {
            const productRef = doc(db, 'products', item.productId);
            batch.update(productRef, { 
                stock: increment(item.quantity),
                costPrice: item.unitCost
            });
        }

        await batch.commit();
    }, 'Compra registrada.', 'Falha ao registrar compra.');

  const finalizeOrder = (order: {items: OrderItem[], total: number, displayName: string}, customerId: string | null, paymentMethod: string) =>
    handleAction(async () => {
        if (!db) throw new Error("Firestore not initialized");
        
        const uniqueProductIds = Array.from(new Set(order.items.map(i => i.productId)));

        return runTransaction(db, async (t) => {
            await Promise.all(uniqueProductIds.map(id => t.get(doc(db, 'products', id))));

            const saleRef = doc(collection(db, 'transactions'));
            
            order.items.forEach(item => {
                const productRef = doc(db, 'products', item.productId);
                t.update(productRef, { stock: increment(-item.quantity) });
            });

            if (paymentMethod === 'Fiado' && customerId) {
                const customerRef = doc(db, 'customers', customerId);
                t.update(customerRef, { balance: increment(order.total) });
            }

            t.set(saleRef, {
                id: saleRef.id,
                timestamp: serverTimestamp(),
                type: 'sale',
                description: `Venda ${order.displayName}`,
                total: order.total,
                items: JSON.parse(JSON.stringify(order.items)),
                paymentMethod,
                customerId,
                tabName: order.displayName,
                userId: user?.uid || null,
            });
            return saleRef.id;
        });
    }, 'Venda da comanda finalizada.', 'Falha ao finalizar venda.');
  
  const addExpense = (description: string, amount: number, category: string, dateString: string, replicateMonths: number = 0) =>
    handleAction(async () => {
        if (!db) throw new Error("Firestore not initialized");
        const batch = writeBatch(db);
        const baseDate = new Date(dateString + 'T12:00:00');

        for (let i = 0; i <= replicateMonths; i++) {
            const expenseRef = doc(collection(db, 'transactions'));
            const currentDate = addMonths(baseDate, i);
            
            batch.set(expenseRef, {
                id: expenseRef.id,
                timestamp: currentDate,
                type: 'expense',
                description: i === 0 ? description : `${description} - ${format(currentDate, 'MM/yy')}`,
                total: amount,
                expenseCategory: category,
                items: [],
                userId: user?.uid || null,
            });
        }
        await batch.commit();
    }, replicateMonths > 0 ? 'Despesas replicadas com sucesso.' : 'Despesa adicionada.', 'Falha ao adicionar despesa.');

  const deleteTransaction = (transactionId: string) =>
    handleAction(() => deleteDoc(doc(db, 'transactions', transactionId)), 'Transação excluída.', 'Falha ao excluir transação.');

  const saveUserRole = (uid: string, role: 'admin' | 'cashier' | 'waiter') =>
    handleAction(() => setDoc(doc(db, 'users', uid), { role }, { merge: true }), 'Cargo do usuário atualizado.', 'Falha ao atualizar cargo.');

  const value: DataContextType = {
    users: usersData || [],
    products: productsData || [],
    customers: customersData || [],
    suppliers: suppliersData || [],
    transactions: transactionsData || [],
    loading,
    saveProduct,
    deleteProduct,
    addStock,
    saveCustomer,
    deleteCustomer,
    receiveCustomerPayment,
    saveSupplier,
    deleteSupplier,
    recordPurchaseAndUpdateStock,
    finalizeOrder,
    addExpense,
    deleteTransaction,
    saveUserRole,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};