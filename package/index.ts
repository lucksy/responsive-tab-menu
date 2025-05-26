export type { TabItem } from "./src/shared-types";
export { useResponsiveTabs } from "./src/useResponsiveTabs";
export { ResponsiveTabsMantine8 } from "./src/ResponsiveTabs.mantine8";
export { ResponsiveTabsMaterial } from "./src/ResponsiveTabs.material";

// For the Web Component, export the class and also import the file for its side effect (customElements.define)
export { ResponsiveTabsWebComponent } from "./src/ResponsiveTabs.webComponent";
import './src/ResponsiveTabs.webComponent'; 

export { ResponsiveTabsShadcn } from "./src/ResponsiveTabs.shadcn";
