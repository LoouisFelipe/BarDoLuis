"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

const mockSuppliers = [
  { id: "1", name: "TechNova Inc." },
  { id: "2", name: "ComponentPro" },
];
const mockProducts = [
  { id: "1", name: "Microchip X1" },
  { id: "2", name: "Resistor Pack" },
];
const initialPurchases = [
    { id: 1, supplier: "TechNova Inc.", product: "Microchip X1", quantity: 100, cost: 500.00, date: "2023-10-01" },
    { id: 2, supplier: "ComponentPro", product: "Resistor Pack", quantity: 500, cost: 50.00, date: "2023-10-02" },
];


export function Purchases() {
  const [purchases, setPurchases] = useState(initialPurchases);

  const handleAddPurchase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Logic to add purchase would go here
    console.log("New purchase added.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rastreamento de Compras</CardTitle>
        <CardDescription>
          Registre novas compras e visualize o histórico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddPurchase} className="mb-8 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {mockSuppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product">Produto</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {mockProducts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input id="quantity" type="number" placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Custo Total</Label>
            <Input id="cost" type="number" placeholder="0.00" />
          </div>
          <Button type="submit" className="w-full md:w-auto">Registrar Compra</Button>
        </form>

        <h3 className="text-lg font-semibold mb-4">Histórico de Compras</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Quantidade</TableHead>
              <TableHead className="text-right">Custo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>{purchase.date}</TableCell>
                <TableCell>{purchase.supplier}</TableCell>
                <TableCell>{purchase.product}</TableCell>
                <TableCell className="text-right">{purchase.quantity}</TableCell>
                <TableCell className="text-right">R$ {purchase.cost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
