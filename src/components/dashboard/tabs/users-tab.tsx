'use client';
import React, { useState } from 'react';
import { UserProfile } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, UserPlus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useData } from '@/contexts/data-context';
import { useToast } from '@/hooks/use-toast';
import { UserCreateModal } from '@/components/users/user-create-modal';
import { UserEditModal } from '@/components/users/user-edit-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const UsersTab: React.FC = () => {
    const { users, loading, saveUserRole, deleteUserProfile } = useData(); 
    const { toast } = useToast();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

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

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await deleteUserProfile(userToDelete.uid);
            setUserToDelete(null);
        } catch (error) {
            console.error("Failed to delete user profile:", error);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spinner /></div>;
    }

    return (
        <div className="p-1 md:p-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-foreground flex items-center">
                        <ShieldCheck className="mr-3 text-primary" /> Gerenciar Usuários
                    </h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Controle de Acessos e Equipe</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 font-black uppercase text-sm w-full md:w-auto h-12 shadow-lg">
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
                                <TableHead className="font-bold uppercase text-[10px]">Nome</TableHead>
                                <TableHead className="font-bold uppercase text-[10px]">E-mail</TableHead>
                                <TableHead className="w-[180px] font-bold uppercase text-[10px]">Cargo</TableHead>
                                <TableHead className="w-[120px] text-right font-bold uppercase text-[10px]">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user: UserProfile) => (
                                <TableRow key={user.uid} className="hover:bg-muted/10 transition-colors">
                                    <TableCell className="font-bold text-sm">{user.name || 'N/A'}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-medium">{user.email}</TableCell>
                                    <TableCell>
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(newRole: 'admin' | 'cashier' | 'waiter') => handleRoleChange(user.uid, newRole)}
                                        >
                                            <SelectTrigger className="h-8 bg-background text-xs font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin" className="text-xs font-bold">Administrador</SelectItem>
                                                <SelectItem value="cashier" className="text-xs font-bold">Caixa</SelectItem>
                                                <SelectItem value="waiter" className="text-xs font-bold">Garçom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => setEditingUser(user)}
                                            >
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setUserToDelete(user)}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
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

            {editingUser && (
                <UserEditModal
                    user={editingUser}
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                />
            )}

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle size={20} /> Revogar Acesso?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Você está prestes a excluir o perfil de <strong>{userToDelete?.name || userToDelete?.email}</strong>. 
                            Este usuário perderá o acesso ao sistema instantaneamente. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/80 text-white font-bold">
                            Sim, revogar acesso
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
