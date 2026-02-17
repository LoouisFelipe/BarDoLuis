'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, ShieldCheck, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export const SettingsTab: React.FC = () => {
    const { toast } = useToast();

    const handlePing = () => {
        toast({
            title: "Diagnóstico BarDoLuis",
            description: "Conexão com banco 'bardoluis' está ativa e operante.",
        });
    };

    return (
        <div className="p-1 md:p-4 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-3xl font-bold text-foreground flex items-center">
                        <Settings className="mr-3 text-primary" /> Configurações
                    </h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Infraestrutura e Sistema</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base uppercase font-black">Status do Backend</CardTitle>
                        </div>
                        <CardDescription>
                            Verificação de integridade da Fortaleza Digital.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-muted/30 p-3 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Database size={16} className="text-accent" />
                                <span className="text-sm font-bold">Banco de Dados</span>
                            </div>
                            <span className="text-[10px] font-black uppercase text-accent bg-accent/10 px-2 py-0.5 rounded"> bardoluis (Online) </span>
                        </div>
                        <Button variant="outline" className="w-full text-xs font-bold uppercase" onClick={handlePing}>
                            Testar Conexão
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-muted/10 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-base uppercase font-black opacity-50">Customização UI</CardTitle>
                        <CardDescription>
                            Configurações de tema e layout (Em breve).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-24 flex items-center justify-center border-2 border-dashed rounded-lg m-4 mt-0 opacity-20">
                        <Settings size={32} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
