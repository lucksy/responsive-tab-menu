import { calculateResponsiveTabs, type VanillaTabItem, type ResponsiveTabsLogicResult } from './responsive-tabs-logic.vanilla';
import type { TabItem as SharedTabItemReact } from './shared-types'; // For potential type compatibility

// Define the structure of items the Web Component expects (can be from JSON attribute)
interface WebComponentTabItem {
  label: string;
  value: string;
  leftSlotHTML?: string; // HTML string for left slot content
  rightSlotHTML?: string; // HTML string for right slot content
}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      overflow: hidden;
      font-family: sans-serif;
    }
    .tabs-container {
      display: flex;
      flex-wrap: nowrap;
      overflow: hidden; /* Managed by logic, not native scroll */
      position: relative; /* For positioning virtual tabs if needed within */
    }
    .tab {
      padding: 8px 16px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px; /* Gap between icon and label */
    }
    .tab.active {
      border-bottom-color: var(--responsive-tab-active-border-color, blue);
      color: var(--responsive-tab-active-color, blue);
    }
    .tab:hover {
      background-color: var(--responsive-tab-hover-bg-color, #f0f0f0);
    }
    .overflow-menu-button {
      padding: 8px;
      cursor: pointer;
      background-color: #eee;
      border: 1px solid #ccc;
      margin-left: auto; /* Pushes it to the right */
      position: relative; /* For dropdown positioning */
    }
    .overflow-dropdown {
      display: none; /* Hidden by default */
      position: absolute;
      top: 100%;
      right: 0;
      background-color: white;
      border: 1px solid #ccc;
      box-shadow: 0 2px 5px rgba(0,0,0,0.15);
      z-index: 10;
      min-width: 150px;
    }
    .overflow-dropdown.open {
      display: block;
    }
    .overflow-dropdown button {
      display: block;
      width: 100%;
      padding: 8px 12px;
      text-align: left;
      background: none;
      border: none;
      cursor: pointer;
    }
    .overflow-dropdown button:hover {
      background-color: #f0f0f0;
    }
    .virtual-tabs-container {
      visibility: hidden;
      position: absolute;
      top: -9999px;
      left: 0;
      height: 0;
      overflow: hidden;
      display: flex; /* Crucial for horizontal layout during measurement */
      white-space: nowrap;
    }
  </style>
  <div class="tabs-container" part="tabs-container">
    <!-- Visible tabs will be rendered here -->
  </div>
  <div class="virtual-tabs-container" part="virtual-tabs-container">
    <!-- Virtual tabs for measurement will be rendered here -->
  </div>
  <!-- Overflow menu button and dropdown will be added if overflowItems exist -->
`;

export class ResponsiveTabsWebComponent extends HTMLElement {
  private shadowRootInstance: ShadowRoot;
  private items: WebComponentTabItem[] = [];
  private _activeTabValue: string | null = null;
  private _menuLabel: string = 'More';
  private _tabGap: number = 8;
  private _reservedSpace: number = 50; // Initial guess for overflow button

  private tabsContainerElement!: HTMLElement;
  private virtualTabsContainerElement!: HTMLElement;
  private overflowMenuButtonElement: HTMLElement | null = null;
  private overflowDropdownElement: HTMLElement | null = null;

  private resizeObserver!: ResizeObserver;

  static get observedAttributes() {
    return ['items', 'active', 'menu-label', 'tab-gap', 'reserved-space'];
  }

  constructor() {
    super();
    this.shadowRootInstance = this.attachShadow({ mode: 'open' });
    this.shadowRootInstance.appendChild(template.content.cloneNode(true));

    this.tabsContainerElement = this.shadowRootInstance.querySelector('.tabs-container')!;
    this.virtualTabsContainerElement = this.shadowRootInstance.querySelector('.virtual-tabs-container')!;
  }

  connectedCallback() {
    this.upgradeProperties();
    this.render();
    this.resizeObserver = new ResizeObserver(() => this.recalculateTabs());
    this.resizeObserver.observe(this.tabsContainerElement);
    this.tabsContainerElement.addEventListener('click', this.handleTabClick.bind(this));
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.tabsContainerElement);
    }
    if (this.overflowMenuButtonElement) {
        this.overflowMenuButtonElement.removeEventListener('click', this.toggleOverflowMenu.bind(this));
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'items':
        try {
          this.items = JSON.parse(newValue || '[]');
        } catch (e) {
          this.items = [];
          console.error('Failed to parse "items" attribute:', e);
        }
        break;
      case 'active':
        this._activeTabValue = newValue;
        break;
      case 'menu-label':
        this._menuLabel = newValue || 'More';
        break;
      case 'tab-gap':
        this._tabGap = Number(newValue) || 8;
        break;
      case 'reserved-space':
        this._reservedSpace = Number(newValue) || 50;
        break;
    }
    this.render(); // Re-render when attributes change
  }

  // Allow setting properties directly, syncing with attributes
  upgradeProperties() {
    const props = ['items', 'active', 'menuLabel', 'tabGap', 'reservedSpace'];
    props.forEach(prop => {
      if (this.hasOwnProperty(prop)) {
        let value = (this as any)[prop];
        delete (this as any)[prop];
        (this as any)[prop] = value;
      }
    });
  }

  // Property setters and getters
  set active(value: string | null) {
    this._activeTabValue = value;
    this.setAttribute('active', value || '');
    this.updateActiveStates();
  }
  get active(): string | null { return this._activeTabValue; }

  set menuLabel(value: string) {
    this._menuLabel = value;
    this.setAttribute('menu-label', value);
    this.renderOverflowMenuButton(); // Update button label
  }
  get menuLabel(): string { return this._menuLabel; }
  
  // ... (add setters/getters for items, tabGap, reservedSpace if needed for imperative updates)

  private handleTabClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const tabElement = target.closest('.tab');
    if (tabElement && tabElement.hasAttribute('data-value')) {
      const value = tabElement.getAttribute('data-value')!;
      if (this._activeTabValue !== value) {
        this.active = value;
        this.dispatchEvent(new CustomEvent('change', { detail: { value } }));
      }
    }
  }
  
  private toggleOverflowMenu(event?: MouseEvent) {
    event?.stopPropagation(); // Prevent tab click if menu button is a tab
    if (this.overflowDropdownElement) {
      const isOpen = this.overflowDropdownElement.classList.toggle('open');
      if (isOpen) {
        document.addEventListener('click', this.closeOverflowMenuOnClickOutside.bind(this), { once: true });
      } else {
        document.removeEventListener('click', this.closeOverflowMenuOnClickOutside.bind(this));
      }
    }
  }

  private closeOverflowMenuOnClickOutside(event: MouseEvent) {
    if (this.overflowDropdownElement && !this.overflowDropdownElement.contains(event.target as Node) &&
        (!this.overflowMenuButtonElement || !this.overflowMenuButtonElement.contains(event.target as Node))) {
      this.overflowDropdownElement.classList.remove('open');
    } else if (this.overflowDropdownElement?.classList.contains('open')) {
        // Re-attach if it was not closed by this click
         document.addEventListener('click', this.closeOverflowMenuOnClickOutside.bind(this), { once: true });
    }
  }

  private createTabElement(item: WebComponentTabItem, isVirtual: boolean = false): HTMLElement {
    const tab = document.createElement('div'); // Could be button for accessibility if not using role="tab"
    tab.className = 'tab';
    if (!isVirtual) {
      tab.setAttribute('part', `tab tab-${item.value}`);
      tab.setAttribute('data-value', item.value);
      if (item.value === this._activeTabValue) {
        tab.classList.add('active');
        tab.setAttribute('part', `tab tab-${item.value} active`);
      }
    }
    
    // Handle slots (simple HTML string injection for now)
    if (item.leftSlotHTML) {
        const leftSlotSpan = document.createElement('span');
        leftSlotSpan.setAttribute('part', 'tab-left-slot');
        leftSlotSpan.innerHTML = item.leftSlotHTML; // CAUTION: Potential XSS if HTML is not sanitized.
        tab.appendChild(leftSlotSpan);
    }
    const labelSpan = document.createElement('span');
    labelSpan.setAttribute('part', 'tab-label');
    labelSpan.textContent = item.label;
    tab.appendChild(labelSpan);

    if (item.rightSlotHTML) {
        const rightSlotSpan = document.createElement('span');
        rightSlotSpan.setAttribute('part', 'tab-right-slot');
        rightSlotSpan.innerHTML = item.rightSlotHTML; // CAUTION: Potential XSS.
        tab.appendChild(rightSlotSpan);
    }
    return tab;
  }

  private render() {
    // 1. Clear previous virtual and visible tabs
    this.virtualTabsContainerElement.innerHTML = '';
    this.tabsContainerElement.innerHTML = ''; // Clear visible tabs area

    // 2. Create and append virtual tabs for measurement
    const virtualTabElements: HTMLElement[] = [];
    this.items.forEach(item => {
      const virtualTab = this.createTabElement(item, true);
      this.virtualTabsContainerElement.appendChild(virtualTab);
      virtualTabElements.push(virtualTab);
    });
    
    // Ensure virtual tabs are rendered before calculation
    // requestAnimationFrame might be needed if direct append doesn't update layout in time for offsetWidth
    // For now, assuming direct append is fine.

    this.recalculateTabs(virtualTabElements);
  }

  private recalculateTabs(providedVirtualTabs?: HTMLElement[]) {
    const virtualElements = providedVirtualTabs || 
      Array.from(this.virtualTabsContainerElement.children) as HTMLElement[];

    if (!this.tabsContainerElement || virtualElements.length !== this.items.length) {
        // If called before elements are ready or mismatch
        if (this.items.length === 0) { // If no items, clear everything
            this.tabsContainerElement.innerHTML = '';
            this.removeOverflowMenu();
        }
        return;
    }
    
    const logicItems: VanillaTabItem[] = this.items.map(i => ({ label: i.label, value: i.value }));

    const result: ResponsiveTabsLogicResult = calculateResponsiveTabs({
      items: logicItems,
      containerElement: this.tabsContainerElement,
      virtualTabElements: virtualElements,
      tabGap: this._tabGap,
      // Adjust reserved space if overflow menu is present
      reservedSpace: this.overflowMenuButtonElement ? this._reservedSpace : 0,
    });
    
    this.updateVisibleTabs(result.visibleItems);
    this.updateOverflowMenu(result.overflowItems);
    this.updateActiveStates(); // Ensure active tab style is correct
  }
  
  private updateVisibleTabs(visibleItems: VanillaTabItem[]) {
    this.tabsContainerElement.innerHTML = ''; // Clear current visible tabs
    visibleItems.forEach(itemData => {
        // Find the full item data which might include slots
        const fullItem = this.items.find(i => i.value === itemData.value);
        if (fullItem) {
            const tabElement = this.createTabElement(fullItem);
            this.tabsContainerElement.appendChild(tabElement);
        }
    });
  }

  private renderOverflowMenuButton() {
    if (!this.overflowMenuButtonElement) return; // If it doesn't exist, this method shouldn't be called
    this.overflowMenuButtonElement.textContent = `${this._menuLabel} (${this.shadowRootInstance.querySelectorAll('.overflow-dropdown button').length})`;
    // Update parts for styling
    this.overflowMenuButtonElement.setAttribute('part', 'overflow-button');
  }

  private updateOverflowMenu(overflowItems: VanillaTabItem[]) {
    this.removeOverflowMenu(); // Clear existing overflow menu first

    if (overflowItems.length > 0) {
      // Create elements and assign to local constants first
      const newMenuButton = document.createElement('button'); // Or a div styled as a tab
      newMenuButton.className = 'overflow-menu-button'; // For specific styling
      newMenuButton.setAttribute('part', 'overflow-button');
      newMenuButton.setAttribute('aria-haspopup', 'true');
      newMenuButton.setAttribute('aria-expanded', 'false');
      
      const newDropdownElement = document.createElement('div');
      newDropdownElement.className = 'overflow-dropdown';
      newDropdownElement.setAttribute('part', 'overflow-dropdown');

      overflowItems.forEach(itemData => {
        const fullItem = this.items.find(i => i.value === itemData.value);
        if (fullItem) {
            const menuItem = document.createElement('button');
            menuItem.setAttribute('part', `overflow-item overflow-item-${fullItem.value}`);
            menuItem.dataset.value = fullItem.value;
            // Handle slots (simple HTML string injection)
            if (fullItem.leftSlotHTML) menuItem.innerHTML += `<span part="overflow-item-left-slot">${fullItem.leftSlotHTML}</span> `;
            const labelSpan = document.createElement('span');
            labelSpan.setAttribute('part', 'overflow-item-label');
            labelSpan.textContent = fullItem.label;
            menuItem.appendChild(labelSpan);
            if (fullItem.rightSlotHTML) menuItem.innerHTML += ` <span part="overflow-item-right-slot">${fullItem.rightSlotHTML}</span>`;
            
            menuItem.addEventListener('click', () => {
              if (this._activeTabValue !== fullItem.value) {
                this.active = fullItem.value;
                this.dispatchEvent(new CustomEvent('change', { detail: { value: fullItem.value } }));
              }
              this.toggleOverflowMenu(); // Close menu
            });
            newDropdownElement.appendChild(menuItem); // Append to the local constant
        }
      });

      // Assign to class members after full creation and population
      this.overflowMenuButtonElement = newMenuButton;
      this.overflowDropdownElement = newDropdownElement;

      // Now use the local, definitely non-null constants for DOM operations
      this.tabsContainerElement.appendChild(newMenuButton);
      
      // this.shadowRootInstance is guaranteed non-null from constructor
      this.shadowRootInstance.appendChild(newDropdownElement); 
      
      newMenuButton.addEventListener('click', this.toggleOverflowMenu.bind(this));
      this.renderOverflowMenuButton(); // This method internally checks this.overflowMenuButtonElement
    }
  }
  
  private removeOverflowMenu() {
    if (this.overflowMenuButtonElement) {
      this.overflowMenuButtonElement.removeEventListener('click', this.toggleOverflowMenu.bind(this));
      this.overflowMenuButtonElement.remove();
      this.overflowMenuButtonElement = null;
    }
    if (this.overflowDropdownElement) {
      this.overflowDropdownElement.remove();
      this.overflowDropdownElement = null;
      document.removeEventListener('click', this.closeOverflowMenuOnClickOutside.bind(this));
    }
  }
  
  private updateActiveStates() {
    this.shadowRootInstance.querySelectorAll('.tab').forEach(tab => {
      if (tab.getAttribute('data-value') === this._activeTabValue) {
        tab.classList.add('active');
        tab.setAttribute('part', `tab tab-${tab.getAttribute('data-value')} active`);
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        tab.classList.remove('active');
        tab.setAttribute('part', `tab tab-${tab.getAttribute('data-value')}`);
      }
    });
    // Could also update style for active item in dropdown if needed
  }
}

// Define the custom element (do this only once)
if (!customElements.get('responsive-tabs-wc')) {
  customElements.define('responsive-tabs-wc', ResponsiveTabsWebComponent);
}
