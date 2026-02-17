'use client';

/**
 * @fileOverview Ponte de compatibilidade (Redirecionador).
 * CTO: Este arquivo não contém mais lógica de negócio. 
 * Todas as conexões internas foram migradas para src/hooks/use-toast.ts.
 * Mantemos este export apenas para compatibilidade com componentes Shadcn automáticos.
 */

export { useToast } from "@/hooks/use-toast";
