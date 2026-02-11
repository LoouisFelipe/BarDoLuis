
// src/hooks/use-memo-firebase.ts

import { useMemo } from 'react';
import { CollectionReference, Query, DocumentData } from 'firebase/firestore';

/**
 * Um hook de memoização personalizado para queries/referências do Firestore.
 * Ele envolve `useMemo` e adiciona uma propriedade `__memo: true` ao objeto retornado.
 * Isso é usado por `useCollection` para verificar se a query/referência foi
 * devidamente memoizada, conforme a expectativa do hook.
 *
 * @template T O tipo do valor sendo memoizado (CollectionReference ou Query do Firestore).
 * @param {() => T} factory A função que calcula o valor a ser memoizado.
 * @param {React.DependencyList} deps A lista de dependências para `useMemo`.
 * @returns {T & { __memo?: boolean }} O valor memoizado com uma propriedade `__memo` adicionada.
 */
export function useMemoFirebase<T extends CollectionReference<DocumentData> | Query<DocumentData> | null | undefined>(
  factory: () => T,
  deps: React.DependencyList
): T & { __memo?: boolean } {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedValue = useMemo(factory, [factory, ...deps]);
  if (memoizedValue) {
    (memoizedValue as any).__memo = true; // Adiciona a propriedade __memo para validação
  }
  return memoizedValue as T & { __memo?: boolean };
}
