'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface SettingsTabProps {
    showNotification: (message: string, type: 'success' | 'error') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ showNotification }) => {

    return (
        <>
            <div className="p-1 md:p-4 space-y-6">
                <h2 className="text-3xl font-bold text-foreground flex items-center">
                    <Settings className="mr-3" /> Configurações e Dados
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações Gerais</CardTitle>
                            <CardDescription>
                                Futuras configurações da aplicação aparecerão aqui.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           {/* Placeholder for future settings */}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};
