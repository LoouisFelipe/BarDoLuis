'use client';
import React, { useState, useEffect } from 'react';
import { analyzeData } from '@/ai/flows/business-analyst';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Spinner } from '../spinner';

export const CustomerAnalysisModal = ({ customer, transactions, open, onOpenChange }) => {
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open) return;

        const generateAnalysis = async () => {
            setLoading(true);
            const customerSales = transactions.filter(t => t.customerId === customer.id && t.type === 'sale');
            if (customerSales.length === 0) {
                setAnalysis("Este cliente ainda não possui histórico de compras para análise.");
                setLoading(false);
                return;
            }

            const purchaseSummary = customerSales
                .flatMap(sale => sale.items)
                .reduce((acc, item) => {
                    acc[item.name] = (acc[item.name] || 0) + item.quantity;
                    return acc;
                }, {});

            const summaryText = Object.entries(purchaseSummary)
                .map(([name, quantity]) => `${quantity}x ${name}`)
                .join(', ');

            const question = `Analise o perfil e o histórico de compras do cliente ${customer.name}. Com base nisso, crie um perfil curto sobre suas preferências e sugira uma ação de marketing ou fidelização para ele. Seja conciso e direto.`;
            
            try {
                const result = await analyzeData({
                    customerProfile: { name: customer.name, purchaseSummary: summaryText },
                    question
                });
                setAnalysis(result.answer);
            } catch (error) {
                console.error("Error analyzing customer:", error);
                setAnalysis("Ocorreu um erro ao contactar a IA. Tente novamente.");
            } finally {
                setLoading(false);
            }
        };

        generateAnalysis();
    }, [customer, transactions, open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>✨ Análise de Perfil de {customer.name}</DialogTitle>
                    <DialogDescription>Insights gerados por IA com base no histórico do cliente.</DialogDescription>
                </DialogHeader>
                {loading ? <div className="flex justify-center p-8"><Spinner /></div> : (
                    <div className="p-4 bg-secondary rounded-lg whitespace-pre-wrap text-foreground animate-fade-in">
                        {analysis}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
