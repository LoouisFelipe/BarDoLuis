'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Componente que escuta erros de permissão globais e os projeta para o 
 * overlay de erro do Next.js para depuração contextual em tempo de desenvolvimento.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      // Deferimos a atualização do estado para garantir que não ocorra
      // durante o ciclo de renderização de outro componente.
      setTimeout(() => {
        setError(err);
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // Lançar o erro durante o render é o padrão recomendado para 
  // acionar o Error Boundary de desenvolvimento com contexto rico.
  if (error) {
    throw error;
  }

  return null;
}
