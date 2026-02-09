
'use client';
import React from 'react';
import { UserProfile } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';

export const UsersTab: React.FC = () => {
    // CORREÇÃO: Tudo em uma única linha. Removemos a duplicata.
    const { users, loading, saveUserRole } = useData(); 
    const { toast } = useToast();

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

    // CPO/CTO Rule: Handle empty states explicitly for better UX and code clarity.
    if (!users || users.length === 0) {
        return (
            <div className="p-1 md:p-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-foreground flex items-center">
                        <ShieldCheck className="mr-3" /> Gerenciar Usuários
                    </h2>
                </div>
                <div className="flex items-center justify-center text-center p-10 border-2 border-dashed rounded-xl bg-muted/20 min-h-[200px]">
                    <p className="text-muted-foreground">Nenhum usuário foi encontrado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-1 md:p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-foreground flex items-center">
                    <ShieldCheck className="mr-3" /> Gerenciar Usuários
                </h2>
            </div>
            <div className="bg-card rounded-xl shadow-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead className="w-[180px]">Cargo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Now safe to map directly after the guard clause above */}
                        {users.map((user: UserProfile) => (
                            <TableRow key={user.uid}>
                                <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Select
                                        defaultValue={user.role}
                                        onValueChange={(newRole: 'admin' | 'cashier' | 'waiter') => handleRoleChange(user.uid, newRole)}
                                    >
                                        <SelectTrigger>
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
        </div>
    );
};
