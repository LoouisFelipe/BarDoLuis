
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { getDb, appId, useConfig } from '@/lib/firebase';
import { doc, addDoc, setDoc, collection } from 'firebase/firestore';
import { analyzeData } from '@/ai/flows/business-analyst';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '../spinner';
import { Sparkles, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ProductFormModal = ({ product, open, onOpenChange, userId, allProducts }) => { 
    const { data: categories, update: addCategory } = useConfig('productCategories', ['Cervejas', 'Cachaças', 'Comidas', 'Águas', 'Refrigerantes']);
    const { data: subcategories, update: addSubcategory } = useConfig('productSubcategories', ['300ml', '600ml', 'Lata', 'Com Bacon', 'Sem Cebola']);
    
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryValue, setNewCategoryValue] = useState('');
    const [showNewSubcategoryInput, setShowNewSubcategoryInput] = useState(false);
    const [newSubcategoryValue, setNewSubcategoryValue] = useState('');
    const [comboSearchTerm, setComboSearchTerm] = useState('');
    
    const initialDoseOptions = [
        { id: 'd50', name: '50ml', size: 50, enabled: false, price: 0 },
        { id: 'd100', name: '100ml', size: 100, enabled: false, price: 0 },
        { id: 'd100Limon', name: '100ml com limão', size: 100, enabled: false, price: 0 }
    ];

    const [formData, setFormData] = useState({
        name: '', subcategoria: '', categoria: '', saleType: 'unit', unitPrice: 0, costPrice: 0,
        baseUnit: 'unidade', baseUnitSize: 1000, stock: 0,
        doseOptions: initialDoseOptions, comboItems: [], description: '', initialStock: 0
    });
    const [processing, setProcessing] = useState(false);
    const [iaLoading, setIaLoading] = useState(false);

    useEffect(() => {
        if (product) {
            const mergedDoseOptions = initialDoseOptions.map(initialDose => {
                const existingDose = product.doseOptions?.find(d => d.id === initialDose.id);
                return existingDose ? { ...initialDose, ...existingDose } : initialDose;
            });

            setFormData({
                name: product.name || '', subcategoria: product.subcategoria || '', categoria: product.categoria || '', saleType: product.saleType || 'unit',
                unitPrice: product.unitPrice || 0, costPrice: product.costPrice || 0,
                baseUnit: product.baseUnit || 'unidade',
                baseUnitSize: product.baseUnitSize || 1000, stock: product.stock || 0,
                doseOptions: mergedDoseOptions, comboItems: product.comboItems || [], description: product.description || '', initialStock: 0
            });
        } else {
             setFormData({
                name: '', subcategoria: '', categoria: '', saleType: 'unit', unitPrice: 0, costPrice: 0,
                baseUnit: 'unidade', baseUnitSize: 1000, stock: 0,
                doseOptions: initialDoseOptions, comboItems: [], description: '', initialStock: 0
            });
        }
    }, [product, open]);

    const handleChange = (name, value) => {
        if (name === 'categoria') setShowNewCategoryInput(value === 'add_new');
        if (name === 'subcategoria') setShowNewSubcategoryInput(value === 'add_new');
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDoseChange = (index, field, value) => {
        const newDoses = [...formData.doseOptions];
        newDoses[index][field] = field === 'enabled' ? value : parseFloat(value) || 0;
        setFormData(prev => ({ ...prev, doseOptions: newDoses }));
    };

    const handleAddComboItem = (item) => {
        setFormData(prev => ({
            ...prev,
            comboItems: [...prev.comboItems, { productId: item.id, name: item.name, quantity: 1 }]
        }));
    };

    const handleRemoveComboItem = (index) => {
        setFormData(prev => ({
            ...prev,
            comboItems: prev.comboItems.filter((_, i) => i !== index)
        }));
    };

    const handleGenerateDescription = async () => {
        if (!formData.name) {
            alert("Por favor, preencha o nome do produto primeiro.");
            return;
        }
        setIaLoading(true);
        const question = `Crie uma descrição curta e atrativa para um cardápio de boteco para o seguinte produto: Nome: ${formData.name}, Categoria: ${formData.categoria}, Subcategoria: ${formData.subcategoria || ''}. Seja criativo e use uma linguagem que dê água na boca. Máximo de 2 frases.`;
        
        try {
            const result = await analyzeData({ question });
            setFormData(prev => ({ ...prev, description: result.answer }));
        } catch (error) {
            console.error("Error generating description:", error)
        } finally {
            setIaLoading(false);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const db = getDb();
        if (!db) return;
        
        let finalCategory = formData.categoria;
        if (formData.categoria === 'add_new') {
            if (!newCategoryValue.trim()) { alert("Por favor, insira um nome para a nova categoria."); return; }
            finalCategory = newCategoryValue.trim();
            if (!categories.some(c => c.toLowerCase() === finalCategory.toLowerCase())) await addCategory(finalCategory);
        }
        if (!finalCategory || finalCategory === 'add_new') { alert("Por favor, selecione ou crie uma categoria válida."); return; }

        let finalSubcategory = formData.subcategoria;
        if (formData.subcategoria === 'add_new') {
            if (!newSubcategoryValue.trim()) { alert("Por favor, insira um nome para a nova subcategoria."); return; }
            finalSubcategory = newSubcategoryValue.trim();
            if (!subcategories.some(sc => sc.toLowerCase() === finalSubcategory.toLowerCase())) await addSubcategory(finalSubcategory);
        }

        setProcessing(true);
        const collectionPath = `artifacts/${appId}/users/${userId}/products`;
        let dataToSave = { ...formData, categoria: finalCategory, subcategoria: finalSubcategory, costPrice: parseFloat(formData.costPrice) || 0 };

        if (dataToSave.saleType === 'unit') { dataToSave = {...dataToSave, baseUnit: 'unidade', baseUnitSize: 1, doseOptions: [], comboItems: []}; } 
        else if (dataToSave.saleType === 'dose') { dataToSave = {...dataToSave, baseUnit: 'ml', unitPrice: 0, comboItems: []}; }
        else if (dataToSave.saleType === 'combo') { dataToSave = {...dataToSave, baseUnit: 'combo', stock: 0, doseOptions: []}; }

        if (!product) { 
            const initialStockNumber = Number(formData.initialStock) || 0;
            if (dataToSave.saleType === 'unit') {
                dataToSave.stock = initialStockNumber;
            } else if (dataToSave.saleType === 'dose') {
                dataToSave.stock = initialStockNumber * (dataToSave.baseUnitSize || 1);
            }
        }
        delete dataToSave.initialStock;


        try {
            if (product) await setDoc(doc(db, collectionPath, product.id), dataToSave, { merge: true });
            else await addDoc(collection(db, collectionPath), dataToSave);
            onOpenChange(false);
        } catch (error) {
            console.error("Erro ao salvar produto: ", error);
        } finally {
            setProcessing(false);
        }
    };

    const comboProductList = useMemo(() => {
        if (!allProducts) return [];
        return allProducts.filter(p => p.saleType !== 'combo' && p.name.toLowerCase().includes(comboSearchTerm.toLowerCase()));
    }, [allProducts, comboSearchTerm]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <ScrollArea className="max-h-[70vh] p-4">
                    <div className="space-y-6">
                        <div><Label>Nome</Label><Input type="text" name="name" placeholder="Ex: Skol, Porção de Fritas" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required /></div>
                        
                        <div>
                            <Label>Categoria</Label>
                            <Select name="categoria" value={formData.categoria} onValueChange={(v) => handleChange('categoria', v)} required>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    <SelectItem value="add_new" className="text-primary">+ Adicionar Nova</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {showNewCategoryInput && <div className="animate-fade-in"><Label>Nova Categoria</Label><Input type="text" value={newCategoryValue} onChange={(e) => setNewCategoryValue(e.target.value)} placeholder="Digite e clique em Salvar" required /></div>}

                        <div>
                            <Label>Subcategoria</Label>
                            <Select name="subcategoria" value={formData.subcategoria} onValueChange={(v) => handleChange('subcategoria', v)}>
                                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Nenhuma</SelectItem>
                                    {subcategories.map(subcat => <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>)}
                                    <SelectItem value="add_new" className="text-primary">+ Adicionar Nova</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {showNewSubcategoryInput && <div className="animate-fade-in"><Label>Nova Subcategoria</Label><Input type="text" value={newSubcategoryValue} onChange={(e) => setNewSubcategoryValue(e.target.value)} placeholder="Digite e clique em Salvar" required /></div>}

                        <div>
                            <Label>Tipo de Venda</Label>
                            <Select name="saleType" value={formData.saleType} onValueChange={(v) => handleChange('saleType', v)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unit">Unidade</SelectItem>
                                    <SelectItem value="dose">Dose/Fração</SelectItem>
                                    <SelectItem value="combo">Combo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {formData.saleType !== 'combo' && <div className="animate-fade-in"><Label>Preço de Custo (R$)</Label><Input type="number" step="0.01" name="costPrice" placeholder="5.00" value={formData.costPrice} onChange={(e) => handleChange('costPrice', e.target.value)} /></div>}

                        {formData.saleType === 'unit' && <div className="animate-fade-in"><Label>Preço de Venda (R$)</Label><Input type="number" step="0.01" name="unitPrice" placeholder="12.00" value={formData.unitPrice} onChange={(e) => handleChange('unitPrice', e.target.value)} /></div>}
                        
                        {!product && formData.saleType !== 'combo' && (
                             <div className="animate-fade-in"><Label>Estoque Inicial (Unidades/Garrafas)</Label><Input type="number" name="initialStock" value={formData.initialStock} onChange={(e) => handleChange('initialStock', e.target.value)} /></div>
                        )}

                        {formData.saleType === 'dose' && (
                            <div className="bg-secondary p-4 rounded-lg space-y-4 animate-fade-in">
                                <div><Label>Tamanho da Garrafa (ml)</Label><Input type="number" name="baseUnitSize" placeholder="1000" value={formData.baseUnitSize} onChange={(e) => handleChange('baseUnitSize', e.target.value)} /></div>
                                <div>
                                   <Label className="mb-2 block">Configuração de Doses</Label>
                                   <div className="space-y-3">
                                       {formData.doseOptions.map((dose, index) => (
                                           <div key={dose.id} className="flex items-center justify-between bg-background p-3 rounded-lg">
                                               <div className="flex items-center"><Checkbox id={dose.id} checked={dose.enabled} onCheckedChange={(c) => handleDoseChange(index, 'enabled', !!c)}/><Label htmlFor={dose.id} className="ml-3">{dose.name}</Label></div>
                                               <div className="flex items-center"><span className="text-muted-foreground mr-2">R$</span><Input type="number" step="0.01" placeholder="7.00" value={dose.price} onChange={(e) => handleDoseChange(index, 'price', e.target.value)} disabled={!dose.enabled} className="w-24 disabled:bg-muted" /></div>
                                           </div>
                                       ))}
                                   </div>
                                </div>
                            </div>
                        )}

                        {formData.saleType === 'combo' && (
                            <div className="bg-secondary p-4 rounded-lg space-y-4 animate-fade-in">
                                <Label>Preço do Combo (R$)</Label>
                                <Input type="number" step="0.01" name="unitPrice" placeholder="30.00" value={formData.unitPrice} onChange={(e) => handleChange('unitPrice', e.target.value)} required/>
                                <Label>Itens do Combo</Label>
                                <ul className="space-y-2">
                                    {formData.comboItems.map((item, index) => <li key={index} className="flex justify-between items-center bg-background p-2 rounded"><span>{item.name}</span><Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveComboItem(index)} className="text-destructive h-6 w-6"><Trash2 size={16}/></Button></li>)}
                                </ul>
                                <Input type="text" placeholder="Buscar produto para adicionar..." value={comboSearchTerm} onChange={e => setComboSearchTerm(e.target.value)} className="mt-2" />
                                <ScrollArea className="h-32 mt-2 border rounded-md">
                                    <ul className="p-2">
                                        {comboProductList.map(p => <li key={p.id} onClick={() => handleAddComboItem(p)} className="p-2 hover:bg-primary/20 rounded cursor-pointer">{p.name}</li>)}
                                    </ul>
                                </ScrollArea>
                            </div>
                        )}

                        <div>
                            <Label>Descrição</Label>
                            <div className="relative">
                                <Textarea name="description" placeholder="Descrição para cardápio..." value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows="3"></Textarea>
                                <Button type="button" onClick={handleGenerateDescription} disabled={iaLoading} size="icon" className="absolute bottom-2 right-2 h-7 w-7 bg-purple-600 hover:bg-purple-500 disabled:opacity-50">
                                   {iaLoading ? <Spinner size="h-4 w-4" /> : <Sparkles size={16}/>}
                                </Button>
                            </div>
                        </div>
                    </div>
                    </ScrollArea>
                    <DialogFooter className="mt-6">
                        <Button type="submit" disabled={processing} className="w-full">
                            {processing ? <Spinner /> : 'Salvar Produto'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
