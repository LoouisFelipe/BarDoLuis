'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Componente que escuta erros de permissão globais e os lança para o Next.js Error Boundary.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Defer state update to avoid rendering conflicts
      setTimeout(() => {
        setError(error);
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // Quando o estado do erro é definido, lançamos o erro para ser capturado pelo overlay de dev.
  if (error) {
    throw error;
  }

  return null;
}
