'use client' 

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
            <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-4">Algo deu errado!</h2>
            <p className="text-muted-foreground mb-6">Ocorreu um erro inesperado na aplicação.</p>
            <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/80"
            onClick={
                // Attempt to recover by trying to re-render the segment
                () => reset()
            }
            >
            Tentar Novamente
            </button>
        </div>
      </body>
    </html>
  )
}
