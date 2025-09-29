import React, { useState } from 'react';
import { Check, ChevronDown, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useRelevantPhoneNumbers } from '@/hooks/useRelevantPhoneNumbers';

interface ContactComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ContactCombobox({
  value,
  onChange,
  placeholder = "חפש או הקלד מספר טלפון...",
  className
}: ContactComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { allRelevantContacts, getContactInfo } = useRelevantPhoneNumbers();

  const selectedContact = getContactInfo(value);

  // Filter contacts based on search
  const filteredContacts = allRelevantContacts.filter((contact) => {
    const searchLower = searchValue.toLowerCase();
    return (
      (contact.name || '').toLowerCase().includes(searchLower) ||
      (contact.propertyAddress || '').toLowerCase().includes(searchLower) ||
      (contact.phone || '').includes(searchValue) ||
      (contact.normalizedPhone || '').includes(searchValue)
    );
  });

  const handleSelect = (contact: typeof allRelevantContacts[0]) => {
    onChange(contact.phone);
    setOpen(false);
    setSearchValue('');
  };

  const handleManualInput = (inputValue: string) => {
    onChange(inputValue);
    setSearchValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between text-right", className)}
        >
          {selectedContact ? (
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
              <div className="flex flex-col items-start overflow-hidden">
                <span className="font-medium truncate">{selectedContact.name}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {selectedContact.propertyAddress}
                </span>
              </div>
              <Badge variant={selectedContact.type === 'tenant' ? 'default' : 'secondary'} className="text-xs">
                {selectedContact.type === 'tenant' ? 'דייר' : 'בעל נכס'}
              </Badge>
            </div>
          ) : value ? (
            <span className="text-right">{value}</span>
          ) : (
            <span className="text-muted-foreground text-right">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="חפש לפי שם או כתובת..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {searchValue && !filteredContacts.some(c => c.phone === searchValue || c.normalizedPhone === searchValue) && (
              <CommandGroup heading="הקלדה ידנית">
                <CommandItem
                  onSelect={() => handleManualInput(searchValue)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>השתמש במספר: {searchValue}</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
            
            {filteredContacts.length === 0 && !searchValue ? (
              <CommandEmpty>טוען אנשי קשר...</CommandEmpty>
            ) : filteredContacts.length === 0 ? (
              <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
            ) : (
              <CommandGroup heading={`אנשי קשר (${filteredContacts.length})`}>
                {filteredContacts.map((contact) => (
                  <CommandItem
                    key={contact.phone}
                    onSelect={() => handleSelect(contact)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === contact.phone ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{contact.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {contact.propertyAddress}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contact.phone}
                          </span>
                        </div>
                      </div>
                      <Badge variant={contact.type === 'tenant' ? 'default' : 'secondary'} className="text-xs">
                        {contact.type === 'tenant' ? 'דייר' : 'בעל נכס'}
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}