// Re-usable type, assuming TabItem definition might be imported or defined if not using React types
// For now, let's assume a simple structure for items if not importing shared-types directly
// to keep this vanilla logic self-contained or easily adaptable.
export interface VanillaTabItem {
  label: string;
  value: string;
  // For Web Components, slots would typically be handled by <slot> elements
  // or by rendering based on attributes. For this logic, we only need value and label
  // for measurement and identification. Visual representation is up to the component.
}

export interface ResponsiveTabsLogicOptions {
  items: VanillaTabItem[];
  containerElement: HTMLElement; // The container whose width is monitored
  virtualTabElements: HTMLElement[]; // Hidden elements used for measurement
  tabGap?: number;
  reservedSpace?: number;
}

export interface ResponsiveTabsLogicResult {
  visibleItems: VanillaTabItem[];
  overflowItems: VanillaTabItem[];
}

export function calculateResponsiveTabs({
  items,
  containerElement,
  virtualTabElements,
  tabGap = 8,
  reservedSpace = 96,
}: ResponsiveTabsLogicOptions): ResponsiveTabsLogicResult {
  if (!containerElement || virtualTabElements.length === 0 || virtualTabElements.length !== items.length) {
    // Not enough information to calculate, or mismatch between items and measurement elements
    return { visibleItems: items, overflowItems: [] };
  }

  const availableWidth = containerElement.offsetWidth - reservedSpace;
  let usedWidth = 0;
  let splitIndex = items.length;

  for (let i = 0; i < items.length; i++) {
    const el = virtualTabElements[i];
    if (el) {
      // Ensure the element is visible for measurement if it was previously hidden by display: none
      // The Web Component will need to manage the styles of these virtual elements.
      const style = window.getComputedStyle(el);
      const elementWidth = el.offsetWidth + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
      
      usedWidth += elementWidth + (i > 0 ? tabGap : 0);

      if (usedWidth > availableWidth) {
        splitIndex = i;
        break;
      }
    } else {
      // If a virtual tab element is unexpectedly null, this indicates an issue.
      // Fallback: treat as if remaining items don't fit.
      splitIndex = i;
      break;
    }
  }
  
  // Handle case where all items fit but there's no space for even one item after reservedSpace
  if (splitIndex === items.length && usedWidth > availableWidth && items.length > 0) {
      if (items.length > 0) {
          const firstEl = virtualTabElements[0];
          if (firstEl) {
              const firstElStyle = window.getComputedStyle(firstEl);
              const firstElementWidth = firstEl.offsetWidth + parseFloat(firstElStyle.marginLeft) + parseFloat(firstElStyle.marginRight);
              if (firstElementWidth > availableWidth) {
                  splitIndex = 0;
              }
          }
      }
  }

  return {
    visibleItems: items.slice(0, splitIndex),
    overflowItems: items.slice(splitIndex),
  };
}

// Example of how a class might use this logic with ResizeObserver
// This is more of a conceptual guide for the Web Component implementation.
/*
class ResponsiveHandler {
  private options: ResponsiveTabsLogicOptions;
  private callback: (result: ResponsiveTabsLogicResult) => void;
  private resizeObserver: ResizeObserver | null = null;

  constructor(options: ResponsiveTabsLogicOptions, callback: (result: ResponsiveTabsLogicResult) => void) {
    this.options = options;
    this.callback = callback;
    this.init();
  }

  private init() {
    this.recalculate(); // Initial calculation
    if (this.options.containerElement) {
      this.resizeObserver = new ResizeObserver(() => this.recalculate());
      this.resizeObserver.observe(this.options.containerElement);
    }
  }

  public recalculate() {
    const result = calculateResponsiveTabs(this.options);
    this.callback(result);
  }

  public updateItems(newItems: VanillaTabItem[], newVirtualElements: HTMLElement[]) {
    this.options.items = newItems;
    this.options.virtualTabElements = newVirtualElements;
    this.recalculate(); // Recalculate when items change
  }
  
  public updateOptions(partialOptions: Partial<Omit<ResponsiveTabsLogicOptions, 'items' | 'virtualTabElements' | 'containerElement'>>) {
    this.options = { ...this.options, ...partialOptions };
    this.recalculate();
  }

  public destroy() {
    if (this.resizeObserver && this.options.containerElement) {
      this.resizeObserver.unobserve(this.options.containerElement);
    }
    this.resizeObserver = null;
  }
}
*/
