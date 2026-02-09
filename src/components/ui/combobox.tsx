
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
  icon?: React.ReactElement; // CPO/CTO: Add optional icon prop
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
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCreateOption = inputValue && !options.some(option => option.label.toLowerCase() === inputValue.toLowerCase());
  
  const displayValue = value ? options.find((option) => option.value === value)?.label || value : placeholder;
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="flex items-center truncate">
            {icon && React.cloneElement(icon, { className: "mr-2 h-4 w-4" })}
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Pesquisar ou criar..." 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
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
                  className="text-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {createLabel} &quot;{inputValue}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
