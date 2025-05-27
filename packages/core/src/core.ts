// Type for each tab item
export type TabItem = {
  label: string;
  value: string;
  leftSlot?: unknown; // Using unknown for now, will be framework-specific
  rightSlot?: unknown; // Using unknown for now, will be framework-specific
};

export class ResponsiveMenuLogic {
  private allItems: TabItem[];
  private visibleItemsState: TabItem[];
  private overflowItemsState: TabItem[];

  constructor(items: TabItem[]) {
    this.allItems = items;
    this.visibleItemsState = items;
    this.overflowItemsState = [];
  }

  get visibleItems(): TabItem[] {
    return this.visibleItemsState;
  }

  get overflowItems(): TabItem[] {
    return this.overflowItemsState;
  }

  calculateOverflow(availableWidth: number, tabWidths: number[]): void {
    let usedWidth = 0;
    let splitIndex = this.allItems.length;

    // Ensure tabWidths has the same length as allItems
    if (tabWidths.length !== this.allItems.length) {
      console.error("tabWidths length does not match allItems length");
      // Fallback: show all items, hide none in overflow if widths are not reliable
      this.visibleItemsState = [...this.allItems];
      this.overflowItemsState = [];
      return;
    }

    for (let i = 0; i < this.allItems.length; i++) {
      const itemWidth = tabWidths[i] || 0; // Use 0 if width is somehow not provided for an item
      usedWidth += itemWidth;
      // Consider a small gap between tabs if that's part of the layout, e.g., + 8;
      // For now, assuming tabWidths includes any margins/paddings

      if (usedWidth > availableWidth) {
        splitIndex = i;
        break;
      }
    }

    this.visibleItemsState = this.allItems.slice(0, splitIndex);
    this.overflowItemsState = this.allItems.slice(splitIndex);
  }
}
