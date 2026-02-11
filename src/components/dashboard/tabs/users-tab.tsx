
'use client';
import React, { useState } from 'react';
import { UserProfile } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { UserCreateModal } from '@/components/users/user-create-modal';

export const UsersTab: React.FC = () => {
    const { users, loading, saveUserRole } = useData(); 
    const { toast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleRoleChange = async (uid: string, newRole: 'admin' | 'cashier' | 'waiter') => {
        try {
            await saveUserRole(uid, newRole);
            toast({
                title: 'Sucesso',
                description: 'O cargo do usuário foi atualizado.',
            });
        } catch (error) {
            console.error("Failed to update user role:", error);
            toast({
                title: 'Erro',
                description: 'Não foi possível atualizar o cargo do usuário.',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    return (
        <div className="p-1 md:p-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-foreground flex items-center">
                    <ShieldCheck className="mr-3" /> Gerenciar Usuários
                </h2>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 font-bold w-full md:w-auto">
                    <UserPlus size={20} /> Novo Usuário
                </Button>
            </div>

            {!users || users.length === 0 ? (
                <div className="flex items-center justify-center text-center p-10 border-2 border-dashed rounded-xl bg-muted/20 min-h-[200px]">
                    <p className="text-muted-foreground">Nenhum usuário foi encontrado.</p>
                </div>
            ) : (
                <div className="bg-card rounded-xl shadow-lg overflow-hidden border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead className="font-bold">Nome</TableHead>
                                <TableHead className="font-bold">E-mail</TableHead>
                                <TableHead className="w-[180px] font-bold">Cargo</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user: UserProfile) => (
                                <TableRow key={user.uid} className="hover:bg-muted/10 transition-colors">
                                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(newRole: 'admin' | 'cashier' | 'waiter') => handleRoleChange(user.uid, newRole)}
                                        >
                                            <SelectTrigger className="h-8 bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Administrador</SelectItem>
                                                <SelectItem value="cashier">Caixa</SelectItem>
                                                <SelectItem value="waiter">Garçom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <UserCreateModal 
                open={isCreateModalOpen} 
                onOpenChange={setIsCreateModalOpen} 
            />
        </div>
    );
};
