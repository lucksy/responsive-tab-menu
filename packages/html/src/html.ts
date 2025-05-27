import { ResponsiveMenuLogic, type TabItem } from 'responsive-tab-menu-core';

interface ResponsiveTabMenuHtmlOptions {
  menuLabel?: string;
  activeTabValue?: string;
  onTabChange?: (newTabValue: string) => void;
}

export function createResponsiveTabMenu(
  containerElement: HTMLElement,
  initialItems: TabItem[],
  options: ResponsiveTabMenuHtmlOptions = {}
) {
  const {
    menuLabel = 'More',
    activeTabValue: initialActiveTabValue,
    onTabChange,
  } = options;

  let currentActiveTabValue = initialActiveTabValue;
  const menuLogic = new ResponsiveMenuLogic(initialItems);

  const mainTabsContainer = document.createElement('div');
  mainTabsContainer.className = 'responsive-tabs-container';

  const visibleTabsElement = document.createElement('div');
  visibleTabsElement.className = 'visible-tabs';

  const moreButtonElement = document.createElement('button');
  moreButtonElement.className = 'more-tabs-button';
  moreButtonElement.style.display = 'none'; // Initially hidden

  const overflowMenuElement = document.createElement('ul');
  overflowMenuElement.className = 'overflow-tabs-menu';
  overflowMenuElement.style.display = 'none'; // Initially hidden as a dropdown

  mainTabsContainer.appendChild(visibleTabsElement);
  mainTabsContainer.appendChild(moreButtonElement);
  mainTabsContainer.appendChild(overflowMenuElement);
  containerElement.appendChild(mainTabsContainer);

  const renderTabs = () => {
    visibleTabsElement.innerHTML = ''; // Clear previous visible tabs
    overflowMenuElement.innerHTML = ''; // Clear previous overflow items

    // Create and append visible tabs
    menuLogic.visibleItems.forEach(item => {
      const tabButton = document.createElement('button');
      tabButton.className = 'tab-item';
      tabButton.textContent = item.label;
      tabButton.dataset.value = item.value;
      if (item.value === currentActiveTabValue) {
        tabButton.classList.add('active');
      }
      tabButton.addEventListener('click', () => {
        if (currentActiveTabValue !== item.value) {
          currentActiveTabValue = item.value;
          onTabChange?.(item.value);
          renderTabs(); // Re-render to update active styles
        }
      });
      visibleTabsElement.appendChild(tabButton);
    });

    // Handle overflow menu
    if (menuLogic.overflowItems.length > 0) {
      moreButtonElement.textContent = `${menuLabel} +${menuLogic.overflowItems.length}`;
      moreButtonElement.style.display = '';
      overflowMenuElement.style.display = 'none'; // Ensure it's hidden before populating

      menuLogic.overflowItems.forEach(item => {
        const listItem = document.createElement('li');
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-item-overflow';
        tabButton.textContent = item.label;
        tabButton.dataset.value = item.value;
        if (item.value === currentActiveTabValue) {
          tabButton.classList.add('active');
        }
        tabButton.addEventListener('click', () => {
          if (currentActiveTabValue !== item.value) {
            currentActiveTabValue = item.value;
            onTabChange?.(item.value);
            overflowMenuElement.style.display = 'none'; // Hide menu after selection
            renderTabs(); // Re-render to update active styles
          }
        });
        listItem.appendChild(tabButton);
        overflowMenuElement.appendChild(listItem);
      });
    } else {
      moreButtonElement.style.display = 'none';
      overflowMenuElement.style.display = 'none';
    }
  };

  moreButtonElement.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent container click listeners if any
    overflowMenuElement.style.display = overflowMenuElement.style.display === 'none' ? 'block' : 'none';
  });

  // Function to calculate and apply overflow
  const calculateAndApplyOverflow = () => {
    // 1. Measure tab widths
    const tempTabContainer = document.createElement('div');
    tempTabContainer.style.visibility = 'hidden';
    tempTabContainer.style.position = 'absolute';
    tempTabContainer.style.height = '0';
    tempTabContainer.style.overflow = 'hidden';
    document.body.appendChild(tempTabContainer);

    const tabWidths = initialItems.map(item => {
      const tabButton = document.createElement('button');
      tabButton.className = 'tab-item'; // Ensure it has the same styling as real tabs for width calculation
      tabButton.textContent = item.label;
      tempTabContainer.appendChild(tabButton);
      const computedStyle = getComputedStyle(tabButton);
      const marginLeft = parseInt(computedStyle.marginLeft) || 0;
      const marginRight = parseInt(computedStyle.marginRight) || 0;
      const width = tabButton.offsetWidth + marginLeft + marginRight;
      return width;
    });
    document.body.removeChild(tempTabContainer);

    // 2. Get available width
    let moreButtonWidth = 0;
    // Estimate more button width if it were visible. This is tricky.
    // For simplicity, let's assume a fixed or measure a hidden "More" button.
    if (initialItems.length > 0) { // Only consider more button if there could be overflow
        const tempMoreButton = moreButtonElement.cloneNode(true) as HTMLElement;
        tempMoreButton.style.visibility = 'hidden';
        tempMoreButton.style.display = 'inline-block'; // So it takes width
        tempMoreButton.textContent = `${menuLabel} +${initialItems.length}`; // Max possible label
        mainTabsContainer.appendChild(tempMoreButton);
        moreButtonWidth = tempMoreButton.offsetWidth + parseInt(getComputedStyle(tempMoreButton).marginLeft) + parseInt(getComputedStyle(tempMoreButton).marginRight);
        mainTabsContainer.removeChild(tempMoreButton);
    }


    const availableWidth = mainTabsContainer.offsetWidth - (menuLogic.overflowItems.length > 0 || tabWidths.reduce((a,b) => a+b, 0) > mainTabsContainer.offsetWidth ? moreButtonWidth : 0) ;

    // 3. Call core logic
    menuLogic.calculateOverflow(availableWidth, tabWidths);

    // 4. Re-render tabs
    renderTabs();
  };

  // Resize Observer
  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(calculateAndApplyOverflow);
  });
  resizeObserver.observe(mainTabsContainer);

  // Initial calculation and render
  // Defer initial calculation slightly to ensure DOM is ready and styles are applied
  requestAnimationFrame(calculateAndApplyOverflow);


  // Public API for the instance
  return {
    updateItems: (newItems: TabItem[]) => {
      initialItems = newItems; // Update the reference for calculateAndApplyOverflow
      // Re-initialize menuLogic or provide a method in ResponsiveMenuLogic to update items.
      // For now, let's assume re-initialization is acceptable for a full item replacement.
      // menuLogic = new ResponsiveMenuLogic(newItems); // This would re-create it.
      // However, the original 'menuLogic' is const.
      // A better approach if `ResponsiveMenuLogic` is immutable regarding its initial items,
      // would be for `createResponsiveTabMenu` to be called again by the user, or for
      // `ResponsiveMenuLogic` to have an `updateAllItems` method.
      // Given the current structure, and to avoid re-creating the whole DOM,
      // we'll update the internal state of the existing menuLogic instance if it had such a method.
      // Since it doesn't, the current `menuLogic.allItems = newItems` line is problematic.
      // Let's assume the intent was that ResponsiveMenuLogic *should* handle this.
      // If ResponsiveMenuLogic.allItems was public or had a setter, this could work.
      // For now, this line will effectively not work as `allItems` is private.
      // The most robust change with current ResponsiveMenuLogic:
      menuLogic['allItems'] = newItems; // This bypasses TypeScript private, not ideal.
                                      // A proper fix is in ResponsiveMenuLogic or re-instantiation.
                                      // Given the constraints, this is a "make it work" for the demo.
                                      // A production library would need a cleaner way.
      // To properly reflect changes in ResponsiveMenuLogic, visibleItemsState and overflowItemsState
      // also need to be reset based on newItems before calculateOverflow is called.
      menuLogic['visibleItemsState'] = newItems;
      menuLogic['overflowItemsState'] = [];


      currentActiveTabValue = newItems.find(item => item.value === currentActiveTabValue)?.value || newItems[0]?.value;
      calculateAndApplyOverflow(); // This will then use the (hacked) new allItems.
    },
    getActiveTab: () => currentActiveTabValue,
    setActiveTab: (value: string) => {
        if (currentActiveTabValue !== value) {
            currentActiveTabValue = value;
            // Potentially call onTabChange here too if that's desired behavior for programmatic changes
            renderTabs();
        }
    },
    destroy: () => {
      resizeObserver.disconnect();
      containerElement.innerHTML = ''; // Clear everything
    },
  };
}
