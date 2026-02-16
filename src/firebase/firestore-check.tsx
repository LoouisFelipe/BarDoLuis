'use client';

import { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * @fileOverview Ferramenta de diagnóstico do CTO.
 * Focada exclusivamente na saúde da conexão com o banco 'bardoluis'.
 */
export function FirestoreCheck() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [log, setLog] = useState<string>('Iniciando diagnóstico de uplink...');

  useEffect(() => {
    const runDiagnostics = async () => {
      setStatus('loading');
      try {
        setLog(prev => prev + '\n📡 Conectando ao banco oficial: "bardoluis"...');
        
        const ref = doc(db, '_diagnostics', 'ping');
        
        await setDoc(ref, {
          timestamp: new Date().toISOString(),
          check: 'OK',
          agent: 'CTO_DEBUGGER',
          database: 'bardoluis',
          environment: process.env.NODE_ENV || 'unknown'
        });

        setLog(prev => prev + '\n✅ SUCESSO: Comunicação bidirecional confirmada com banco "bardoluis".');
        setStatus('success');
      } catch (error: any) {
        console.error('Firestore Error:', error);
        setLog(prev => prev + `\n❌ FALHA CRÍTICA: ${error.message}`);
        
        if (error.message.includes('Not Found') || error.code === 'not-found') {
             setLog(prev => prev + '\n⚠️ ERRO DE INSTÂNCIA: A instância "bardoluis" não foi encontrada. Verifique se o ID está correto no Console Firebase.');
        }
        setStatus('error');
      }
    };

    runDiagnostics();
  }, []);

  return (
    <div className="p-4 m-4 border rounded-lg bg-slate-950 text-slate-100 font-mono text-xs shadow-xl">
      <h3 className="font-bold text-yellow-500 mb-2 flex items-center gap-2">🛠️ CTO DATABASE DIAGNOSTICS</h3>
      <pre className="whitespace-pre-wrap bg-black/50 p-2 rounded border border-slate-800">{log}</pre>
      <div className={`mt-2 h-1 w-full rounded transition-all duration-500 ${
        status === 'loading' ? 'bg-blue-500 animate-pulse' :
        status === 'success' ? 'bg-green-500' :
        status === 'error' ? 'bg-red-500' : 'bg-gray-500'
      }`} />
    </div>
  );
}
