# Responsive Tab Menu Monorepo

This monorepo contains packages for a Jira-like responsive tab menu component, implemented for plain HTML/JavaScript, React, and specifically tailored for Mantine UI applications.

## Overview

The goal is to provide a flexible and easy-to-use tab menu that adapts to different screen sizes by moving overflowing tab items into a "More" dropdown menu.

## Packages

This monorepo is structured using npm workspaces and includes the following packages:

*   **`packages/core`**:
    *   Contains the core, framework-agnostic logic for calculating tab overflow and managing visible/overflowing items. This package is intended to be used internally by the framework-specific implementations.

*   **`packages/html`**:
    *   Provides an implementation for plain HTML and JavaScript projects.
    *   **Usage:**
        ```javascript
        // main.js
        import { createResponsiveTabMenu } from 'responsive-tab-menu-html';
        // ... setup and initialization code ...
        ```
        Include the necessary CSS for styling (see `apps/demo/html/src/styles.css` for an example).

*   **`packages/react`**:
    *   Provides a React component for use in React applications, specifically designed to integrate well with Mantine UI.
    *   **Usage:**
        ```jsx
        // App.tsx
        import { ResponsiveTabMenu, TabItem } from 'responsive-tab-menu-react';
        // ... component usage ...
        ```

## Getting Started

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (v7 or later, for workspace support), yarn, or pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd responsive-tab-menu-monorepo
    ```
2.  Install dependencies from the root directory:
    ```bash
    npm install
    ```
    This will install dependencies for all packages and link them using npm workspaces.

### Building Packages

*   To build all packages that have a `build` script:
    ```bash
    npm run build
    ```
    This command uses `npm run build -ws --if-present` to run the build script in each workspace.
*   To build a specific package (e.g., `responsive-tab-menu-core`):
    ```bash
    npm run build -w responsive-tab-menu-core
    # or
    # cd packages/core && npm run build
    ```
    The `postinstall` script in the root `package.json` automatically builds the core, html, and react packages to ensure they are ready for use by the demo applications.

## Running Demo Applications

Demo applications are available in the `apps/demo/` directory to showcase the functionality of each package.

*   **HTML Demo:**
    *   Command: `npm run dev:html`
    *   This will typically just print a message. Open `apps/demo/html/index.html` directly in your browser to view.

*   **React Demo (Minimal):**
    *   Command: `npm run dev:react`
    *   Vite will start a development server and provide a URL (e.g., `http://localhost:5173`).

*   **Mantine Demo (Feature-rich):**
    *   Command: `npm run dev:mantine`
    *   Vite will start a development server and provide a URL (e.g., `http://localhost:5174` or similar).

## Contributing

Contributions are welcome! If you're adding features or fixing bugs, please:

1.  Ensure your changes are well-tested.
2.  If applicable, update or add a demo application in `apps/demo/` to reflect your changes.
3.  Follow the existing code style.
4.  Open a pull request with a clear description of your changes.

## License

This project is not yet licensed. A LICENSE file will be added soon (e.g., MIT License).
