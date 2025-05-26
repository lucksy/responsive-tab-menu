'use client';

import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button'; // For virtual tabs, or use Tab for measurement
import { useResponsiveTabs } from './useResponsiveTabs';
import type { TabItem } from './shared-types';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'; // Example icon for "More"

interface ResponsiveTabsMaterialProps {
  items: TabItem[];
  active: string; // Value of the active tab
  onChange: (value: string) => void;
  menuLabel?: string;
  tabGap?: number;
  reservedSpace?: number;
  // Props for Material UI Tabs component itself
  muiTabsProps?: Omit<React.ComponentProps<typeof Tabs>, 'value' | 'onChange' | 'children'>;
  // Props for Material UI Tab components (applied to each visible tab)
  muiTabProps?: Omit<React.ComponentProps<typeof Tab>, 'value' | 'label' | 'icon'>;
   // Props for the "More" Tab component
  muiMoreTabProps?: Omit<React.ComponentProps<typeof Tab>, 'value' | 'label' | 'icon' | 'onClick'>;
}

export function ResponsiveTabsMaterial({
  items,
  active,
  onChange,
  menuLabel = 'More',
  tabGap,
  reservedSpace,
  muiTabsProps,
  muiTabProps,
  muiMoreTabProps,
}: ResponsiveTabsMaterialProps) {
  const containerRef = useRef<HTMLDivElement>(null); // For the Tabs container
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // For the Menu

  const { visibleTabs, overflowTabs, virtualTabRefs } = useResponsiveTabs({
    items,
    containerRef,
    tabGap: tabGap ?? 8, // MUI default tab spacing might differ, adjust if needed
    reservedSpace: reservedSpace ?? (overflowTabs.length > 0 ? 48 : 0), // MUI "More" tab is smaller
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOverflowItemClick = (value: string) => {
    onChange(value);
    handleMenuClose();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    if (newValue !== '__more__') {
      onChange(newValue);
    }
  };
  
  // Scroll active tab into view
  useEffect(() => {
    if (containerRef.current) {
      const activeTabElement = containerRef.current.querySelector(`button[role="tab"][data-value="${active}"]`);
      activeTabElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [active, visibleTabs]); // Re-run if active tab or visible set changes

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Virtual tab row for measurement by useResponsiveTabs hook */}
      {/* These should be styled to match MUI Tab's width characteristics */}
      <Box
        sx={{
          visibility: 'hidden',
          position: 'absolute',
          top: -9999,
          left: 0,
          height: 0,
          overflow: 'hidden',
          display: 'flex', // Ensure horizontal layout for measurement
          whiteSpace: 'nowrap',
        }}
      >
        {items.map((item, i) => (
          <Button // Using Button for simplicity; could be unstyled Tab if easier
            key={`virtual-${item.value}`}
            ref={(el: HTMLButtonElement | null) => (virtualTabRefs.current[i] = el)}
            // Attempt to replicate MUI Tab styling that affects width:
            // This is tricky. MUI Tabs have complex styling.
            // Min-width is a key factor for MUI tabs.
            // sx prop might not perfectly replicate if internal classes are complex.
            // A more robust way might involve rendering actual <Tab> components here,
            // but they need to be unstyled or specifically styled for measurement.
            style={{
              minWidth: '72px', // Default for MUI Tabs unless `variant="scrollable"` with `scrollButtons="auto"` allows shrinking
              padding: '12px 16px', // Approximate from MUI Tab
              textTransform: 'uppercase', // Default for MUI Tab
              // Add other relevant styles: font-size, letter-spacing, etc.
              fontSize: '0.875rem',
              fontWeight: 500,
              lineHeight: 1.75,
              letterSpacing: '0.02857em',
            }}
          >
            {item.leftSlot} {/* Render slots if they contribute to width */}
            {item.label}
            {item.rightSlot}
          </Button>
        ))}
      </Box>

      <Tabs
        {...muiTabsProps}
        value={active}
        onChange={handleTabChange}
        ref={containerRef} // Ref for useResponsiveTabs to measure available width
        variant="scrollable" // Important for preventing MUI's own overflow handling
        scrollButtons={false} // Disable MUI's scroll buttons
        TabIndicatorProps={{ style: { display: overflowTabs.length > 0 && active === '__more__' ? 'none': undefined } }} // Hide indicator if "More" is "active"
        sx={{
          overflow: 'hidden', // Ensure our hook handles overflow, not native scroll
          ...(muiTabsProps?.sx),
        }}
      >
        {visibleTabs.map((item) => (
          <Tab
            {...muiTabProps}
            key={item.value}
            value={item.value}
            label={item.label}
            icon={item.leftSlot} // MUI Tab uses `icon` for left slot
            iconPosition="start" // Or "end" for rightSlot, but MUI Tab `icon` is typically one side
            // To support both, label could be a ReactNode: <span>{item.leftSlot}{item.label}{item.rightSlot}</span>
            // For simplicity, using `icon` for `leftSlot`. `rightSlot` might need custom rendering within `label`.
            data-value={item.value} // For easier selection in scrollIntoView
            sx={{
              minWidth: 'auto', // Override default min-width if needed for fitting more tabs
              // flexShrink: 0, // Prevent shrinking if container is too small before overflow logic kicks in
              ...(muiTabProps?.sx),
            }}
          />
        ))}

        {overflowTabs.length > 0 && (
          <Tab
            {...muiMoreTabProps}
            key="__more__"
            value="__more__" // Special value for the "More" tab
            label={`${menuLabel} (${overflowTabs.length})`}
            icon={<MoreHorizIcon />}
            onClick={handleMenuClick}
            sx={{
              minWidth: 'auto', // Adjust as needed
              // flexShrink: 0,
              ...(muiMoreTabProps?.sx),
            }}
          />
        )}
      </Tabs>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'responsive-tab-menu',
        }}
      >
        {overflowTabs.map((item) => (
          <MenuItem
            key={item.value}
            selected={item.value === active}
            onClick={() => handleOverflowItemClick(item.value)}
          >
            {item.leftSlot} {/* Basic support for slots in MenuItem */}
            {item.label}
            {item.rightSlot}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
```
