
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string, isCreation?: boolean) => void;
  placeholder: string;
  createLabel: string;
  disabled?: boolean;
  id?: string;
  icon?: React.ReactElement; 
}

export function Combobox({ options, value, onChange, placeholder, createLabel, disabled = false, id, icon }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  
  const handleSelect = (currentValue: string, isCreation = false) => {
    if (isCreation) {
        if (onChange) onChange(inputValue, true);
    } else {
        const newValue = currentValue === value ? "" : currentValue;
        if (onChange) onChange(newValue, false);
    }
    setOpen(false);
    setInputValue(""); // Limpa a busca após selecionar
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCreateOption = inputValue.trim() !== "" && !options.some(option => option.label.toLowerCase() === inputValue.toLowerCase());
  
  const displayValue = value ? options.find((option) => option.value === value)?.label || value : placeholder;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 bg-background border-2 font-bold rounded-xl"
          disabled={disabled}
        >
          <span className="flex items-center truncate">
            {icon && React.cloneElement(icon, { className: "mr-2 h-4 w-4" })}
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover border-2 rounded-xl shadow-2xl z-[100]">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Pesquisar ou criar..." 
            value={inputValue}
            onValueChange={setInputValue}
            className="h-12 font-bold"
          />
          <CommandList className="max-h-64 scrollbar-hide">
            {filteredOptions.length === 0 && !showCreateOption && (
                <CommandEmpty className="py-6 text-center text-xs font-bold uppercase text-muted-foreground">Nenhum resultado.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => handleSelect(currentValue)}
                  className="h-11 font-bold uppercase text-[10px] cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-primary",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem 
                  key={`__create__${inputValue}`}
                  value={`__create__${inputValue}`}
                  onSelect={() => handleSelect(inputValue, true)} 
                  className="h-12 font-black uppercase text-[10px] text-accent hover:bg-accent/10 cursor-pointer border-t border-border/10 mt-1"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {createLabel} "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
