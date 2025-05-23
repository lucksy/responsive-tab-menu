/**
 * ResponsiveTabMenu - A swipeable, responsive tab/button menu for Mantine 7
 * Author: [Your Name]
 * License: MIT
 */

'use client';

import {
  ActionIcon,
  Button,
  Group,
  Menu,
  rem,
  Stack,
  Tabs,
  TabsList,
  TabsTab,
  useMantineTheme,
} from '@mantine/core';
import { useEffect, useRef, useState } from 'react';

// Swipe detection hook
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

  return {
    onTouchStart,
    onTouchEnd,
  };
}

type TabItem = {
  label: string;
  value: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

type ResponsiveTabMenuProps = {
  items: TabItem[];
  active: string;
  onChange: (value: string) => void;
  menuLabel?: string;
  variant?: 'tabs' | 'button';
};

export const ResponsiveTabMenu = ({
  items,
  active,
  onChange,
  menuLabel = 'More',
  variant = 'tabs',
}: ResponsiveTabMenuProps) => {
  const theme = useMantineTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [moreWidth, setMoreWidth] = useState(96);
  const [visibleItems, setVisibleItems] = useState<TabItem[]>(items);
  const [overflowItems, setOverflowItems] = useState<TabItem[]>([]);

  useEffect(() => {
    const updateWidth = () => {
      if (moreRef.current) {
        setMoreWidth(moreRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    let frameId: number;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        calculateOverflow();
      });
    });
    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [items, moreWidth]);

  const calculateOverflow = () => {
    const container = containerRef.current;
    if (!container) return;
    const availableWidth = container.offsetWidth - moreWidth;
    let usedWidth = 0;
    let splitIndex = items.length;
    for (let i = 0; i < items.length; i++) {
      const ref = tabRefs.current[i];
      if (ref) {
        usedWidth += ref.offsetWidth + 8;
        if (usedWidth > availableWidth) {
          splitIndex = i;
          break;
        }
      }
    }
    const newVisible = items.slice(0, splitIndex);
    const newOverflow = items.slice(splitIndex);
    if (newVisible.length !== visibleItems.length || newOverflow.length !== overflowItems.length) {
      setVisibleItems(newVisible);
      setOverflowItems(newOverflow);
    }
  };

  const deferOnChange = (value: string) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => onChange(value));
    } else {
      setTimeout(() => onChange(value), 50);
    }
  };

  const activeIndex = items.findIndex((item) => item.value === active);
  const { onTouchStart, onTouchEnd } = useSwipe(
    () => {
      if (activeIndex < items.length - 1) deferOnChange(items[activeIndex + 1].value);
    },
    () => {
      if (activeIndex > 0) deferOnChange(items[activeIndex - 1].value);
    }
  );

  return (
    <div style={{ overflow: 'hidden' }}>
      <Tabs
        value={active}
        onChange={(value) => {
          if (value && value !== '__more') onChange(value);
        }}
      >
        <TabsList
          ref={containerRef}
          style={{
            flexWrap: 'nowrap',
            overflow: 'hidden',
            minWidth: 0,
            width: '100%',
            scrollBehavior: 'smooth',
            display: 'flex'
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {visibleItems.map((item, index) => (
            <TabsTab
              key={`visible-${item.value}-${index}`}
              value={item.value}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              leftSection={item.leftSlot}
              rightSection={item.rightSlot}
            >
              {item.label}
            </TabsTab>
          ))}

          {overflowItems.length > 0 && (
            <Menu withinPortal shadow="md" position="bottom-start" offset={4}>
              <Menu.Target>
                <TabsTab
                  ref={moreRef}
                  value="__more"
                  onClick={(e) => e.preventDefault()}
                >
                  {menuLabel} +{overflowItems.length}
                </TabsTab>
              </Menu.Target>
              <Menu.Dropdown>
                <Stack gap={2} p="xs">
                  {overflowItems.map((item, index) => (
                    <Button
                      key={`overflow-${item.value}-${index}`}
                      onClick={() => deferOnChange(item.value)}
                      leftSection={item.leftSlot}
                      rightSection={item.rightSlot}
                      variant="subtle"
                      color={item.value === active ? theme.primaryColor : 'gray'}
                      size="xs"
                      radius="sm"
                      fullWidth
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
    </div>
  );
};
