"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getCustomerInsights } from "@/ai/flows/customer-insights";
import type { CustomerInsightsOutput } from "@/ai/schemas/customer-insights-schema";
import { Loader2, Lightbulb, Sparkles, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  customerPurchaseHistory: z.string().min(10, {
    message: "O histórico de compras deve ter pelo menos 10 caracteres.",
  }),
  customerPreferences: z.string().min(10, {
    message: "As preferências devem ter pelo menos 10 caracteres.",
  }),
});

export function AiInsights() {
  const [result, setResult] = useState<CustomerInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerPurchaseHistory: "",
      customerPreferences: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const insights = await getCustomerInsights(values);
      setResult(insights);
    } catch (error) {
      console.error("Failed to get AI insights:", error);
      toast({
        variant: "destructive",
        title: "Erro de IA",
        description: "Não foi possível gerar insights. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer AI Insights</CardTitle>
          <CardDescription>
            Forneça dados do cliente para gerar insights e ações de marketing com IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="customerPurchaseHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Histórico de Compras do Cliente</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: comprou 3x widgets azuis, 1x gadget verde..."
                        className="resize-none font-code"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferências do Cliente</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: prefere produtos ecológicos, sensível a preços..."
                        className="resize-none font-code"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  "Gerar Insights"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="space-y-6">
        {isLoading && (
            <Card className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Analisando dados...</p>
            </Card>
        )}
        {result && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Lightbulb className="w-6 h-6 text-accent" />
                <CardTitle>Insights Gerados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.insights}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <CardTitle>Ações de Marketing Sugeridas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.suggestedMarketingActions}</p>
              </CardContent>
            </Card>
          </>
        )}
        {!isLoading && !result && (
            <Card className="flex flex-col items-center justify-center min-h-[400px] border-dashed">
                <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Os insights da IA aparecerão aqui.</p>
            </Card>
        )}
      </div>
    </div>
  );
}
