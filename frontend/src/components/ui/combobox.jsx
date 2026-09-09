import * as React from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Combobox = BaseCombobox.Root;
export const ComboboxValue = BaseCombobox.Value;

export const ComboboxTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <BaseCombobox.Trigger
      ref={ref}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left font-normal',
        className
      )}
      {...props}
    >
      <span className="truncate flex-1">{children}</span>
      <BaseCombobox.Icon className="ml-2 shrink-0 text-slate-400">
        <ChevronsUpDown className="h-4 w-4" />
      </BaseCombobox.Icon>
    </BaseCombobox.Trigger>
  )
);
ComboboxTrigger.displayName = 'ComboboxTrigger';

export const ComboboxInput = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div className="relative flex items-center w-full">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
      <BaseCombobox.Input
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm ring-offset-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    </div>
  )
);
ComboboxInput.displayName = 'ComboboxInput';

export const ComboboxContent = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <BaseCombobox.Portal>
      <BaseCombobox.Positioner sideOffset={4} className="z-50 min-w-[var(--anchor-width)]">
        <BaseCombobox.Popup
          ref={ref}
          className={cn(
            'relative max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md focus:outline-none',
            className
          )}
          {...props}
        >
          {children}
        </BaseCombobox.Popup>
      </BaseCombobox.Positioner>
    </BaseCombobox.Portal>
  )
);
ComboboxContent.displayName = 'ComboboxContent';

export const ComboboxList = React.forwardRef(
  ({ className, ...props }, ref) => (
    <BaseCombobox.List
      ref={ref}
      className={cn('space-y-0.5 p-1', className)}
      {...props}
    />
  )
);
ComboboxList.displayName = 'ComboboxList';

export const ComboboxItem = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <BaseCombobox.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-teal-50 data-[highlighted]:text-teal-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="flex-1">{children}</span>
      <BaseCombobox.ItemIndicator className="ml-2 flex h-4 w-4 items-center justify-center text-teal-600">
        <Check className="h-4 w-4" />
      </BaseCombobox.ItemIndicator>
    </BaseCombobox.Item>
  )
);
ComboboxItem.displayName = 'ComboboxItem';

export const ComboboxEmpty = React.forwardRef(
  ({ className, ...props }, ref) => (
    <BaseCombobox.Empty
      ref={ref}
      className={cn('py-4 text-center text-sm text-slate-500', className)}
      {...props}
    />
  )
);
ComboboxEmpty.displayName = 'ComboboxEmpty';
