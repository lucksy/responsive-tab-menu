// In apps/demo/html/src/main.js
// IMPORTANT: For this import to work directly in a browser when opening index.html,
// 'responsive-tab-menu-html' must be resolvable. This typically means:
// 1. You are using a development server that handles Node-style module resolution.
// 2. Or, you have a build step that bundles this code.
// 3. Or, you are using import maps in your HTML.
// The 'responsive-tab-menu-html' package should also be built to produce an ES module.
import { createResponsiveTabMenu } from 'responsive-tab-menu-html';

const sampleTabs = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Orders', value: 'orders' },
  { label: 'Products', value: 'products' },
  { label: 'Customers', value: 'customers' },
  { label: 'Analytics', value: 'analytics' },
  { label: 'Settings', value: 'settings' },
  { label: 'Support', value: 'support' },
  { label: 'Account', value: 'account' }
];

const container = document.getElementById('tab-menu-container');

if (container) {
  const tabMenu = createResponsiveTabMenu(container, sampleTabs, {
    menuLabel: 'More Tabs',
    activeTabValue: 'dashboard',
    onTabChange: (newTabValue) => {
      console.log(`HTML Demo: Active tab changed to ${newTabValue}`);
      // You could also call tabMenu.setActiveTab(newTabValue) here if needed,
      // but the component should handle its own active state internally based on clicks.
    }
  });
  // Example of using the API:
  // setTimeout(() => tabMenu.setActiveTab('products'), 3000);
  // setTimeout(() => tabMenu.updateItems([...sampleTabs, {label: 'New Item', value: 'new'}]), 5000);
} else {
  console.error('Tab menu container not found');
}
