'use client'; // Shadcn components are client components

import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import { cn } from './utils'; // Assuming Shadcn's `cn` utility is available for classnames

// Import Shadcn UI components (actual paths might vary based on project setup)
// These are typical names, adjust if your project structure is different.
// You might need to ensure these components (and their dependencies like Radix UI primitives)
// are installed in the 'package' workspace.
import { Tabs, TabsList, TabsTrigger } from '@radix-ui/react-tabs'; // Or from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@radix-ui/react-dropdown-menu'; // Or from '@/components/ui/dropdown-menu'
import { Button } from '@radix-ui/react-button'; // Or from '@/components/ui/button' for virtual & overflow trigger
import { MoreHorizontal } from 'lucide-react'; // Example icon

import { useResponsiveTabs } from './useResponsiveTabs';
import type { TabItem } from './shared-types';

interface ResponsiveTabsShadcnProps {
  items: TabItem[];
  active: string; // Value of the active tab
  onChange: (value: string) => void;
  menuLabel?: string;
  tabGap?: number;       // Passed to useResponsiveTabs
  reservedSpace?: number; // Passed to useResponsiveTabs

  // ClassNames for styling specific parts via Tailwind
  className?: string; // For the root container
  tabsListClassName?: string;
  tabTriggerClassName?: string; // Applied to each visible tab trigger
  activeTabTriggerClassName?: string; // Applied to the active tab trigger
  overflowButtonClassName?: string;
  dropdownMenuContentClassName?: string;
  dropdownMenuItemClassName?: string;
}

export function ResponsiveTabsShadcn({
  items,
  active,
  onChange,
  menuLabel = 'More',
  tabGap,
  reservedSpace,
  className,
  tabsListClassName,
  tabTriggerClassName,
  activeTabTriggerClassName,
  overflowButtonClassName,
  dropdownMenuContentClassName,
  dropdownMenuItemClassName,
}: ResponsiveTabsShadcnProps) {
  const containerRef = useRef<HTMLDivElement>(null); // For the TabsList
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);

  // tabRefs for scrolling active tab into view
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);


  // Adapt reservedSpace for Shadcn's typical DropdownMenuTrigger (a button)
  const defaultReservedSpace = 70; // Estimate for a "More" button with icon + count

  const { visibleTabs, overflowTabs, virtualTabRefs } = useResponsiveTabs({
    items,
    containerRef,
    tabGap: tabGap ?? 4, // Shadcn TabsList often has small gap from `space-x-*`
    reservedSpace: reservedSpace ?? (overflowTabs.length > 0 ? defaultReservedSpace : 0),
  });

  // Scroll active tab into view
  useEffect(() => {
    const activeVisibleIndex = visibleTabs.findIndex(item => item.value === active);
    if (activeVisibleIndex !== -1 && tabRefs.current[activeVisibleIndex]) {
      tabRefs.current[activeVisibleIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [active, visibleTabs]);

  const handleTabChange = (value: string) => {
    if (value !== '__more__') {
      onChange(value);
    }
  };

  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {/* Virtual tab row for measurement by useResponsiveTabs hook */}
      {/* These MUST be styled to match Shadcn TabsTrigger's width characteristics */}
      <div
        className="invisible absolute top-[-9999px] left-0 h-0 overflow-hidden flex whitespace-nowrap"
      >
        {items.map((item, i) => (
          <Button // Using Button, styled like TabsTrigger. Or an unstyled TabsTrigger.
            key={`virtual-${item.value}`}
            ref={(el: HTMLButtonElement | null) => (virtualTabRefs.current[i] = el)}
            variant="ghost" // Common Shadcn variant that might match TabsTrigger base style
            size="sm"       // Common Shadcn size
            className={cn(
              // Mimic Shadcn TabsTrigger styling that affects width:
              // Typically: inline-flex items-center justify-center whitespace-nowrap rounded-sm
              // px-3 py-1.5 text-sm font-medium
              // ring-offset-background transition-all
              // focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              // disabled:pointer-events-none disabled:opacity-50
              // data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm
              // (The important parts are padding, font, and any intrinsic spacing)
              'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium',
              // Add any specific styles from your project's TabsTrigger if customized
              tabTriggerClassName 
            )}
          >
            {item.leftSlot}
            {item.label}
            {item.rightSlot}
          </Button>
        ))}
      </div>

      <Tabs
        value={active}
        onValueChange={handleTabChange}
        className="w-full" // Ensure Tabs itself takes full width
      >
        <TabsList
          ref={containerRef}
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", // Default Shadcn TabsList style
            "w-full overflow-hidden flex-nowrap", // Crucial for our hook: w-full, overflow-hidden, flex-nowrap
            tabsListClassName
          )}
          style={{ overflow: 'hidden', flexWrap: 'nowrap' }} // Ensure no native scroll/wrap
        >
          {visibleTabs.map((item, index) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              ref={(el: HTMLButtonElement | null) => (tabRefs.current[index] = el)}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm', // Active styles
                tabTriggerClassName,
                item.value === active && activeTabTriggerClassName
              )}
              // Shadcn TabsTrigger can take children directly for slots
            >
              {item.leftSlot}
              {item.leftSlot && item.label ? <span className="mx-1"></span> : null} 
              {item.label}
              {item.rightSlot && item.label ? <span className="mx-1"></span> : null}
              {item.rightSlot}
            </TabsTrigger>
          ))}

          {overflowTabs.length > 0 && (
            <DropdownMenu open={isOverflowMenuOpen} onOpenChange={setIsOverflowMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button // Using a Button styled like a TabsTrigger or a specific overflow button
                  variant="ghost" // Or another appropriate variant
                  size="sm"       // Or another appropriate size
                  className={cn(
                    'ml-auto flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium', // Base style
                    // 'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm', // Optional active style
                    overflowButtonClassName
                  )}
                  aria-label={menuLabel}
                >
                  <MoreHorizontal className="h-4 w-4 mr-1" />
                  <span>({overflowTabs.length})</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={cn(dropdownMenuContentClassName)}>
                <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {overflowTabs.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() => handleTabChange(item.value)}
                    className={cn(
                      'flex items-center', // Ensure items align if slots are present
                      item.value === active && 'bg-accent', // Example active style for dropdown
                      dropdownMenuItemClassName
                    )}
                  >
                    {item.leftSlot}
                    {item.leftSlot && item.label ? <span className="mx-1"></span> : null}
                    {item.label}
                    {item.rightSlot && item.label ? <span className="mx-1"></span> : null}
                    {item.rightSlot}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
}
```
