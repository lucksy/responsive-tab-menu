'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react'; // Keep useState for active tab if managed internally, or remove if purely controlled
import {
  Box,
  Button,
  Menu,
  Stack,
  Tabs,
  TabsList,
  TabsTab,
  useMantineTheme,
  type TabsProps,
} from '@mantine/core';
import type { TabItem } from './shared-types'; // Corrected import path
import { useResponsiveTabs } from './useResponsiveTabs'; // Import the new hook

// Props for the Mantine specific wrapper
type ResponsiveTabsMantine8Props = {
  items: TabItem[];
  active: string; // Currently active tab value
  onChange: (value: string) => void; // Called when a new tab is selected
  menuLabel?: string; // Label for the "More" dropdown tab
  styles?: TabsProps['styles']; // Optional Mantine styles override
  tabGap?: number; // Optional: pass to hook
  reservedSpace?: number; // Optional: pass to hook
};

// Hook for detecting swipe gestures (left and right) - Keep as is
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStartX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const deltaX = e.changedTouches[0].screenX - touchStartX.current;
      if (deltaX > 50) onSwipeRight();
      else if (deltaX < -50) onSwipeLeft();
    }
    touchStartX.current = null;
  };

  return { onTouchStart, onTouchEnd };
}

// Rename the component function
export function ResponsiveTabsMantine8({
  items,
  active,
  onChange,
  menuLabel = 'More',
  styles,
  tabGap, // Pass down to useResponsiveTabs
  reservedSpace, // Pass down to useResponsiveTabs
}: ResponsiveTabsMantine8Props) {
  const theme = useMantineTheme();
  const containerRef = useRef<HTMLDivElement>(null); // This ref is for the TabsList
  // tabRefs for scrolling active tab into view - keep this logic
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]); 

  // Use the core hook
  const { visibleTabs, overflowTabs, virtualTabRefs } = useResponsiveTabs({
    items,
    containerRef, // Pass the TabsList ref to the hook
    tabGap,
    reservedSpace,
  });

  // Defer tab switch - Keep as is
  const deferOnChange = (value: string) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => onChange(value));
    } else {
      setTimeout(() => onChange(value), 50);
    }
  };

  // Setup swipe support - Keep as is, but adjust based on visibleTabs if necessary
  // Or, more simply, keep it based on all `items` for consistency in navigation.
  const activeIndex = items.findIndex((item) => item.value === active);
  const { onTouchStart, onTouchEnd } = useSwipe(
    () => {
      if (activeIndex < items.length - 1) {
        const nextItem = items[activeIndex + 1];
        deferOnChange(nextItem.value);
        // Find the ref in the potentially filtered visibleTabs or main tabRefs
        const visibleIndex = visibleTabs.findIndex(vt => vt.value === nextItem.value);
        if (visibleIndex !== -1 && tabRefs.current[visibleIndex]) {
             tabRefs.current[visibleIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
      }
    },
    () => {
      if (activeIndex > 0) {
        const prevItem = items[activeIndex - 1];
        deferOnChange(prevItem.value);
        const visibleIndex = visibleTabs.findIndex(vt => vt.value === prevItem.value);
         if (visibleIndex !== -1 && tabRefs.current[visibleIndex]) {
            tabRefs.current[visibleIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
      }
    }
  );
  
  // Effect to scroll active tab into view
  useEffect(() => {
    const currentVisibleIndex = visibleTabs.findIndex(item => item.value === active);
    if (currentVisibleIndex !== -1 && tabRefs.current[currentVisibleIndex]) {
      tabRefs.current[currentVisibleIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [active, visibleTabs]);


  return (
    <Box w="100%" mih={0} style={{ overflow: 'hidden' }}>
      {/* Virtual tab row for measuring widths - required by useResponsiveTabs hook */}
      {/* Ensure these buttons have styles that match the actual tabs for accurate measurement */}
      <Box style={{ visibility: 'hidden', position: 'absolute', top: -9999, left:0, height: 0, overflow: 'hidden', display: 'flex', whiteSpace: 'nowrap' }}>
        {items.map((item, i) => (
          <Button // Or Mantine's Tabs.Tab if it can be rendered standalone and unstyled for measurement
            key={`virtual-${item.value}`}
            ref={(el) => {
              if (virtualTabRefs.current) {
                virtualTabRefs.current[i] = el;
              }
            }}
            size="sm" // Example: ensure this matches visible tab styling
            variant="subtle" // Example: ensure this matches visible tab styling
            radius="sm" // Example: ensure this matches visible tab styling
            style={{
                // Apply any styles that affect width: padding, border, margin (if not captured by offsetWidth)
                // This should mirror the styling of the actual TabsTab components
                paddingLeft: theme.spacing.xs, // Example from Mantine Tabs
                paddingRight: theme.spacing.xs, // Example from Mantine Tabs
                height: 'auto', // Don't let height affect this measurement row
            }}
          >
            {item.label} 
            {/* Include left/right slots if they affect width and are part of the items for measurement */}
            {/* {item.leftSlot} {item.rightSlot}  // This might be complex if slots are arbitrary ReactNodes */}
          </Button>
        ))}
      </Box>

      <Tabs
        value={active}
        onChange={(value) => {
          if (value && value !== '__more') onChange(value); // Original logic
        }}
        styles={styles}
      >
        <TabsList
          ref={containerRef} // This ref is used by the hook to measure available width
          style={{
            flexWrap: 'nowrap',
            overflow: 'hidden', // Important: prevent native scroll, let the hook manage overflow
            minWidth: 0,
            width: '100%',
            display: 'flex', // Ensure flex layout for items
          }}
          onTouchStart={onTouchStart} // Keep swipe handlers
          onTouchEnd={onTouchEnd}
        >
          {/* Render visible tabs from the hook */}
          {visibleTabs.map((item, index) => (
            <TabsTab
              key={`visible-${item.value}`}
              value={item.value}
              ref={(el) => (tabRefs.current[index] = el)} // For scrolling active tab into view
              leftSection={item.leftSlot}
              rightSection={item.rightSlot}
            >
              {item.label}
            </TabsTab>
          ))}

          {/* Overflow dropdown menu - logic remains similar */}
          {overflowTabs.length > 0 && (
            <Menu withinPortal shadow="md" position="bottom-start" offset={4}>
              <Menu.Target>
                <TabsTab value="__more" onClick={(e) => e.preventDefault()} style={{ flexShrink: 0 }}>
                  {menuLabel} +{overflowTabs.length}
                </TabsTab>
              </Menu.Target>
              <Menu.Dropdown>
                <Stack gap={2} p="xs" align="flex-start">
                  {overflowTabs.map((item) => (
                    <Button
                      key={`overflow-${item.value}`}
                      onClick={() => deferOnChange(item.value)}
                      leftSection={item.leftSlot}
                      rightSection={item.rightSlot}
                      variant="subtle"
                      color={item.value === active ? theme.primaryColor : 'gray'}
                      size="xs"
                      radius="sm"
                      fullWidth={false} // Mantine specific
                      style={{ justifyContent: 'flex-start', minWidth: 120 }}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              </Menu.Dropdown>
            </Menu>
          )}
        </TabsList>
      </Tabs>
    </Box>
  );
}

// Optional: Export with a more specific name if preferred, e.g. ResponsiveTabsMantine
// export { ResponsiveTabsMantine8 as ResponsiveTabsMantine };
