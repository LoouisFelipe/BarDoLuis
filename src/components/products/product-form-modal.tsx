
'use client';
import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Product } from '@/lib/schemas';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Combobox } from '../ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '../ui/switch';
import { Trash2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductFormModalProps {
  product?: Partial<Product> | null;
  allProducts: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Product, 'id'>, id?: string) => Promise<string>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ product: initialProduct, allProducts, open, onOpenChange, onSave }) => {
  const isEditing = !!initialProduct?.id;
  const { toast } = useToast();
  
  const form = useForm<Product>({
    defaultValues: {
      id: '',
      name: '',
      category: '',
      subcategory: '',
      description: '',
      costPrice: 0,
      unitPrice: 0,
      stock: 0,
      lowStockThreshold: null,
      saleType: 'unit',
      doseOptions: [],
      baseUnitSize: null,
    },
  });

  const { formState: { isSubmitting, errors }, control, handleSubmit, reset, watch } = form;
  const saleType = watch('saleType');
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'doseOptions',
  });

  useEffect(() => {
    if (open) {
      if (initialProduct) {
        reset({
            id: initialProduct.id || '',
            name: initialProduct.name || '',
            category: initialProduct.category || '',
            subcategory: initialProduct.subcategory || '',
            description: initialProduct.description || '',
            costPrice: initialProduct.costPrice || 0,
            unitPrice: initialProduct.unitPrice || 0,
            stock: initialProduct.stock || 0,
            lowStockThreshold: initialProduct.lowStockThreshold ?? null,
            saleType: initialProduct.saleType || 'unit',
            doseOptions: initialProduct.doseOptions || [],
            baseUnitSize: initialProduct.baseUnitSize ?? null,
        });
      } else {
        reset({
          id: '',
          name: '',
          category: '',
          subcategory: '',
          description: '',
          costPrice: 0,
          unitPrice: 0,
          stock: 0,
          lowStockThreshold: null,
          saleType: 'unit',
          doseOptions: [],
          baseUnitSize: null,
        });
      }
    }
  }, [initialProduct, open, reset]);

  const onSubmit = async (formData: Product) => {
    if (!formData.name) {
        form.setError('name', { message: 'Nome do produto é obrigatório.' });
        return;
    }
    if (!formData.category) {
        form.setError('category', { message: 'Categoria é obrigatória.' });
        return;
    }

    try {
      await onSave(formData, initialProduct?.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar produto: ", error);
      toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar o produto. Tente novamente.",
          variant: "destructive"
      });
    }
  }

  const productNames = useMemo(() => {
    const uniqueNames = new Set(allProducts.map(p => p.name).filter(Boolean));
    return Array.from(uniqueNames).sort().map(name => ({ value: name, label: name }));
  }, [allProducts]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(allProducts.map(p => p.category).filter(Boolean));
    return Array.from(uniqueCategories).sort().map(cat => ({ value: cat, label: cat }));
  }, [allProducts]);
  
  const subcategories = useMemo(() => {
    const uniqueSubcategories = new Set(allProducts.map(p => p.subcategory).filter(Boolean));
    return Array.from(uniqueSubcategories).sort().map(sub => ({ value: sub!, label: sub! }));
  }, [allProducts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>Preencha os detalhes para adicionar ou atualizar um produto em seu inventário.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="flex-grow flex flex-col overflow-hidden">
                 <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                    <div className="space-y-6 py-4">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-foreground border-b pb-2">Identificação</h3>
                            
                            <FormField
                                control={control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Nome do Produto</FormLabel>
                                    <FormControl>
                                        <Combobox 
                                            options={productNames}
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Selecione ou digite o nome"
                                            createLabel="Usar novo nome:"
                                            id="product-name"
                                            disabled={isEditing && !!initialProduct?.name}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Categoria</FormLabel>
                                        <FormControl>
                                            <Combobox 
                                                options={categories}
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Selecione ou crie uma categoria"
                                                createLabel="Criar nova categoria:"
                                                id="product-category"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name="subcategory"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Subcategoria (Opcional)</FormLabel>
                                    <FormControl>
                                    <Combobox
                                        options={subcategories}
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        placeholder="Selecione ou crie uma subcategoria"
                                        createLabel="Criar nova subcategoria:"
                                        id="product-subcategory"
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            
                            <FormField control={control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Descrição para o cardápio..." {...field} value={field.value || ''} rows={3}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium text-foreground border-b pb-2">Preços e Estoque</h3>
                            <FormField
                                control={control}
                                name="saleType"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Como este produto é vendido?</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} >
                                        <FormControl>
                                            <SelectTrigger id="product-saleType">
                                                <SelectValue/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unit">Por Unidade/Garrafa</SelectItem>
                                            <SelectItem value="dose">Por Dose</SelectItem>
                                            <SelectItem value="service">Serviço / Valor Aberto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                            {saleType !== 'service' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                        <FormField control={control} name="costPrice" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Preço de Custo (R$)</FormLabel>
                                                <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        
                                        <FormField control={control} name="stock" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Estoque ({saleType === 'unit' ? 'Unidades' : 'ml total'})</FormLabel>
                                                <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                    </div>
                                    <FormField
                                        control={control}
                                        name="lowStockThreshold"
                                        render={({ field }) => (
                                        <FormItem className="animate-fade-in">
                                            <FormLabel>Alerta de Estoque Mínimo (Opcional)</FormLabel>
                                            <FormControl><Input type="number" placeholder={`Nº de ${saleType === 'unit' ? 'unidades' : 'garrafas'}`} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </>
                            )}

                            {saleType === 'unit' && (
                                <FormField control={control} name="unitPrice" render={({ field }) => (
                                    <FormItem className="animate-fade-in">
                                        <FormLabel>Preço de Venda (R$)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value || '0'))} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            )}
                            
                            {saleType === 'dose' && (
                                <div className="space-y-4 p-4 border border-dashed border-border rounded-lg animate-fade-in">
                                    <FormField control={control} name="baseUnitSize" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tamanho da Unidade Base (ml)</FormLabel>
                                            <FormControl><Input type="number" placeholder="Ex: 750 (para uma garrafa de 750ml)" {...field} value={field.value ?? ''} onChange={e => { const val = parseInt(e.target.value, 10); field.onChange(isNaN(val) ? null : val); }} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <h4 className="font-semibold text-foreground">Opções de Doses para Venda</h4>
                                    {fields.map((item, index) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-2 items-start bg-secondary p-2 rounded-md">
                                            <FormField control={control} name={`doseOptions.${index}.name`} render={({ field }) => (
                                                <FormItem className="col-span-12 sm:col-span-4"><FormLabel className="sr-only">Nome da dose</FormLabel><FormControl><Input placeholder="Nome da dose" {...field} /></FormControl><FormMessage/></FormItem>
                                            )}/>
                                            <FormField control={control} name={`doseOptions.${index}.size`} render={({ field }) => (
                                                <FormItem className="col-span-6 sm:col-span-3"><FormLabel className="sr-only">Tamanho (ml)</FormLabel><FormControl><Input type="number" placeholder="Tamanho (ml)" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}/></FormControl><FormMessage/></FormItem>
                                            )}/>
                                            <FormField control={control} name={`doseOptions.${index}.price`} render={({ field }) => (
                                                <FormItem className="col-span-6 sm:col-span-3"><FormLabel className="sr-only">Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Preço (R$)" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl><FormMessage/></FormItem>
                                            )}/>
                                            <div className="col-span-12 sm:col-span-2 flex items-center justify-between gap-2 pt-1 sm:pt-0">
                                                <FormField control={control} name={`doseOptions.${index}.enabled`} render={({ field }) => (
                                                    <FormItem className="flex items-center space-x-2"><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Ativa</FormLabel></FormItem>
                                                )}/>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive h-8 w-8"><Trash2 size={16}/></Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', size: 50, price: 0, enabled: true })}><PlusCircle size={16} className="mr-2"/> Adicionar Opção de Dose</Button>
                                    {errors.doseOptions && <p className="text-sm font-medium text-destructive">{typeof errors.doseOptions.message === 'string' && errors.doseOptions.message}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                 </div>
                <DialogFooter className="flex-shrink-0 pt-4 mt-4 border-t">
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner /> : 'Salvar Produto'}
                    </Button>
                </DialogFooter>
              </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
