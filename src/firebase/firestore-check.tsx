'use client';

import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function FirestoreCheck() {
  // ✅ Regra de Ouro #1: Hooks no topo
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string>('Iniciando diagnóstico de uplink...');

  useEffect(() => {
    const runDiagnostics = async () => {
      setStatus('loading');
      try {
        // 1. Identificação do Alvo
        setLog(prev => prev + '\n📡 Conectando ao banco: "bardoluis"...');
        
        // 2. Teste de Escrita (Ping)
        // Usamos uma coleção _diagnostics para não sujar dados de produção (Orders/Products)
        const ref = doc(db, '_diagnostics', 'ping');
        
        // ✅ Regra de Ouro #2: Sanitização (embora aqui os dados sejam controlados)
        await setDoc(ref, {
          timestamp: new Date().toISOString(),
          check: 'OK',
          agent: 'CTO_DEBUGGER',
          environment: process.env.NODE_ENV || 'unknown'
        });

        setLog(prev => prev + '\n✅ SUCESSO: Escrita confirmada em _diagnostics/ping');
        setStatus('success');
      } catch (error: any) {
        console.error('Firestore Error:', error);
        setLog(prev => prev + `\n❌ FALHA CRÍTICA: ${error.message}`);
        
        if (error.message.includes('Not Found') || error.code === 'not-found') {
             setLog(prev => prev + '\n⚠️ ALERTA: O banco de dados nomeado "bardoluis" pode não existir no projeto. Verifique se ele foi criado no Console do Firebase ou mude para "(default)".');
        }
        setStatus('error');
      }
    };

    runDiagnostics();
  }, []);

  return (
    <div className="p-4 m-4 border rounded-lg bg-slate-950 text-slate-100 font-mono text-xs shadow-xl">
      <h3 className="font-bold text-yellow-500 mb-2 flex items-center gap-2">🛠️ CTO DIAGNOSTICS TOOL</h3>
      <pre className="whitespace-pre-wrap bg-black/50 p-2 rounded border border-slate-800">{log}</pre>
      <div className={`mt-2 h-1 w-full rounded transition-all duration-500 ${
        status === 'loading' ? 'bg-blue-500 animate-pulse' :
        status === 'success' ? 'bg-green-500' :
        status === 'error' ? 'bg-red-500' : 'bg-gray-500'
      }`} />
    </div>
  );
}