'use client';

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';
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
import { ResponsiveMenuLogic, type TabItem as CoreTabItem } from 'responsive-tab-menu-core';

// Type for each tab item, extending the core type with React-specific elements
export type TabItem = CoreTabItem & {
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

type ResponsiveTabMenuProps = {
  items: TabItem[]; // All tab items
  active: string;                       // Currently active tab value
  onChange: (value: string) => void;    // Called when a new tab is selected
  menuLabel?: string;                   // Label for the "More" dropdown tab
  styles?: TabsProps['styles'];         // Optional Mantine styles override
};

// Hook for detecting swipe gestures (left and right)
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

export function ResponsiveTabMenu({
  items,
  active,
  onChange,
  menuLabel = 'More',
  styles,
}: ResponsiveTabMenuProps) {
  const theme = useMantineTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const virtualRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Encapsulate responsive logic
  const menuLogic = useMemo(() => new ResponsiveMenuLogic(items), [items]);
  const [visibleItems, setVisibleItems] = useState<TabItem[]>(menuLogic.visibleItems as TabItem[]);
  const [overflowItems, setOverflowItems] = useState<TabItem[]>(menuLogic.overflowItems as TabItem[]);

  // Defer tab switch to avoid blocking interactions
  const deferOnChange = (value: string) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => onChange(value));
    } else {
      setTimeout(() => onChange(value), 50);
    }
  };

  // Recalculate which tabs fit and which go into overflow
  const calculateOverflow = () => {
    if (!containerRef.current || virtualRefs.current.length === 0) return;

    const availableWidth = containerRef.current.offsetWidth - 65; // 96px reserved for "More"
    const tabWidths = virtualRefs.current.map(el => (el ? el.offsetWidth + 8 : 0));

    menuLogic.calculateOverflow(availableWidth, tabWidths);
    setVisibleItems([...menuLogic.visibleItems] as TabItem[]);
    setOverflowItems([...menuLogic.overflowItems] as TabItem[]);
  };

  // Run once on mount or if items change
  useLayoutEffect(() => {
    // Ensure virtual refs are populated before first calculation
    requestAnimationFrame(calculateOverflow);
  }, [items, menuLogic]);

  // Resize observer to recalculate overflow dynamically
  useEffect(() => {
    const observer = new ResizeObserver(() => requestAnimationFrame(calculateOverflow));
    const currentContainerRef = containerRef.current;
    if (currentContainerRef) {
      observer.observe(currentContainerRef);
    }
    return () => {
      if (currentContainerRef) {
        observer.unobserve(currentContainerRef);
      }
      observer.disconnect();
    };
  }, [items, menuLogic, calculateOverflow]);

  // Setup swipe support for touch devices
  const activeIndex = items.findIndex((item) => item.value === active);
  const { onTouchStart, onTouchEnd } = useSwipe(
    () => {
      if (activeIndex < items.length - 1) {
        const next = items[activeIndex + 1];
        deferOnChange(next.value);
        tabRefs.current[activeIndex + 1]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    },
    () => {
      if (activeIndex > 0) {
        const prev = items[activeIndex - 1];
        deferOnChange(prev.value);
        tabRefs.current[activeIndex - 1]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  );

  return (
    <Box w="100%" mih={0} style={{ overflow: 'hidden' }}>
      {/* Virtual tab row for measuring widths without rendering */}
      <Box style={{ visibility: 'hidden', position: 'absolute', height: 0, overflow: 'hidden' }}>
        {items.map((item, i) => (
          <Button
            key={`virtual-${item.value}`}
            ref={(el) => (virtualRefs.current[i] = el)}
            size="sm"
            variant="subtle"
            radius="sm"
          >
            {item.label}
          </Button>
        ))}
      </Box>

      <Tabs
        value={active}
        onChange={(value) => {
          if (value && value !== '__more') onChange(value);
        }}
        styles={styles}
      >
        <TabsList
          ref={containerRef}
          style={{
            flexWrap: 'nowrap',
            overflow: 'hidden',
            minWidth: 0,
            width: '100%',
            scrollBehavior: 'smooth',
            display: 'flex',
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Render all visible tabs */}
          {visibleItems.map((item, index) => (
            <TabsTab
              key={`visible-${item.value}`}
              value={item.value}
              ref={(el) => (tabRefs.current[index] = el)}
              leftSection={item.leftSlot}
              rightSection={item.rightSlot}
            >
              {item.label}
            </TabsTab>
          ))}

          {/* Overflow dropdown menu */}
          {overflowItems.length > 0 && (
            <Menu withinPortal shadow="md" position="bottom-start" offset={4}>
              <Menu.Target>
                <TabsTab value="__more" onClick={(e) => e.preventDefault()}>
                  {menuLabel} +{overflowItems.length}
                </TabsTab>
              </Menu.Target>
              <Menu.Dropdown>
                <Stack gap={2} p="xs" align="flex-start">
                  {overflowItems.map((item) => (
                    <Button
                      key={`overflow-${item.value}`}
                      onClick={() => deferOnChange(item.value)}
                      leftSection={item.leftSlot}
                      rightSection={item.rightSlot}
                      variant="subtle"
                      color={item.value === active ? theme.primaryColor : 'gray'}
                      size="xs"
                      radius="sm"
                      fullWidth={false}
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
