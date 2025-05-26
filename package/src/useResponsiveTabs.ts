import { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react';
import type { TabItem } from './shared-types';

interface UseResponsiveTabsProps {
  items: TabItem[];
  containerRef: React.RefObject<HTMLElement>;
  tabGap?: number;
  reservedSpace?: number; // For "More" button or other elements
}

interface UseResponsiveTabsResult {
  visibleTabs: TabItem[];
  overflowTabs: TabItem[];
  virtualTabRefs: React.RefObject<(HTMLButtonElement | null)[]>; // For measuring
}

export function useResponsiveTabs({
  items,
  containerRef,
  tabGap = 8, // Default gap between tabs
  reservedSpace = 96, // Default space reserved for "More" dropdown / other controls
}: UseResponsiveTabsProps): UseResponsiveTabsResult {
  const [visibleTabs, setVisibleTabs] = useState<TabItem[]>(items);
  const [overflowTabs, setOverflowTabs] = useState<TabItem[]>([]);
  const virtualTabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Ensure virtualTabRefs array is synced with items length
  useEffect(() => {
    virtualTabRefs.current = virtualTabRefs.current.slice(0, items.length);
  }, [items]);

  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || virtualTabRefs.current.length === 0) {
      // If container is not yet available, or no virtual tabs to measure, show all items
      // or if items list is empty.
      if (items.length === 0) {
        setVisibleTabs([]);
        setOverflowTabs([]);
        return;
      }
      // Fallback if refs not ready, could be improved
      // setVisibleTabs(items); 
      // setOverflowTabs([]);
      return;
    }

    const availableWidth = containerRef.current.offsetWidth - reservedSpace;
    let usedWidth = 0;
    let splitIndex = items.length;

    for (let i = 0; i < items.length; i++) {
      const el = virtualTabRefs.current[i];
      if (el) {
        // Ensure the element is visible for measurement if it was previously hidden by display: none
        // This might require a more sophisticated approach if elements are truly display:none
        // For now, we assume the virtual tabs are structured to be measurable (e.g., visibility: hidden)
        const style = window.getComputedStyle(el);
        const elementWidth = el.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
        
        usedWidth += elementWidth + (i > 0 ? tabGap : 0); // Add tabGap for items other than the first

        if (usedWidth > availableWidth) {
          splitIndex = i;
          break;
        }
      } else {
        // If a virtual tab element is unexpectedly null, we can't measure it.
        // This might indicate an issue with ref assignment or timing.
        // For robustness, we could either try to estimate or log an error.
        // console.warn(`Virtual tab element at index ${i} is null.`);
        // As a fallback, let's assume it doesn't fit if we encounter this.
        // This prevents an infinite loop if some refs are missing.
        // However, this could also mean we prematurely move items to overflow.
        // A better strategy might be to wait or use estimated widths if some refs are missing.
        // For now, if a ref is missing, we assume it's an error state and don't update.
        // This could be revisited. A simple approach is to stop and not change current state.
        // console.warn(`Cannot calculate overflow: virtual tab ref at index ${i} is missing.`);
        // return; // Or handle differently
      }
    }
    
    // Handle case where all items fit but there's no space for even one item after reservedSpace
    if (splitIndex === items.length && usedWidth > availableWidth && items.length > 0) {
        // If all items together exceed available width, but the loop didn't find a split point
        // (e.g. even the first item is too large after reserved space),
        // then all items should be in overflow if not even one fits.
        // However, the loop for `splitIndex` should ideally catch the first item if it exceeds `availableWidth`.
        // This condition might be more relevant if `availableWidth` is very small.
        // If the first item itself is wider than `availableWidth`, `splitIndex` should become 0.
        // Let's refine the logic: if usedWidth for the very first item > availableWidth, splitIndex should be 0.
        if (items.length > 0) {
            const firstEl = virtualTabRefs.current[0];
            if (firstEl) {
                const firstElStyle = window.getComputedStyle(firstEl);
                const firstElementWidth = firstEl.offsetWidth + parseFloat(firstElStyle.marginLeft) + parseFloat(firstElStyle.marginRight);
                if (firstElementWidth > availableWidth) {
                    splitIndex = 0;
                }
            }
        }
    }


    setVisibleTabs(items.slice(0, splitIndex));
    setOverflowTabs(items.slice(splitIndex));

  }, [items, containerRef, tabGap, reservedSpace]);

  // Run once on mount or if items/refs change (layout effect for immediate UI update)
  useLayoutEffect(() => {
    // Initial calculation
    calculateOverflow();
  }, [calculateOverflow]); // items, containerRef, tabGap, reservedSpace are dependencies of calculateOverflow

  // Resize observer to recalculate overflow dynamically
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      // requestAnimationFrame(calculateOverflow); // Debounce with rAF
      calculateOverflow(); // Direct call might be fine for ResizeObserver
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [containerRef, calculateOverflow]); // calculateOverflow has its own deps

  return { visibleTabs, overflowTabs, virtualTabRefs };
}
