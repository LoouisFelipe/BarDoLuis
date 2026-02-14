import { useMemo, DependencyList } from 'react';
import { CollectionReference, Query, DocumentData } from 'firebase/firestore';

/**
 * Hook de memoização personalizado para referências/queries do Firestore.
 * Garante que a referência só seja recriada quando as dependências reais mudarem,
 * evitando loops infinitos em listeners de tempo real.
 */
export function useMemoFirebase<T extends CollectionReference<DocumentData> | Query<DocumentData> | null | undefined>(
  factory: () => T,
  deps: DependencyList
): T & { __memo?: boolean } {
  /**
   * REGRA DE OURO: O factory não deve ser uma dependência para evitar loops
   * se for definido inline no componente.
   */
  const memoizedValue = useMemo(factory, deps);
  
  if (memoizedValue && typeof memoizedValue === 'object') {
    (memoizedValue as any).__memo = true;
  }
  
  return memoizedValue as T & { __memo?: boolean };
}
