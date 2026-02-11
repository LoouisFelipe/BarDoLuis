
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { auth } from '@/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      setError('Acesso negado. Verifique suas credenciais.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Logo size={64} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">Bar do Luis</CardTitle>
            <CardDescription className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest flex items-center justify-center gap-1">
              <Lock size={10} /> Sistema de Gestão Privado
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          
          {error && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
              <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@bardoluis.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" title="Senha" className="text-xs font-bold uppercase text-muted-foreground">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-background/50"
                />
              </div>
              <Button className="w-full mt-2 font-bold uppercase tracking-wider" type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar no Sistema'}
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-tighter">
              <span className="bg-card px-2 text-muted-foreground">
                Acesso Restrito
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-border/20 pt-6">
            <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-tighter opacity-50">
                Somente funcionários autorizados.<br/>Contate o CEO para novas credenciais.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
