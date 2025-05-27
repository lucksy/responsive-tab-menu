# Responsive Tab Menu Monorepo

This monorepo contains packages for a Jira-like responsive tab menu component, implemented for plain HTML/JavaScript, React, and specifically tailored for Mantine UI applications.

## Overview

The goal is to provide a flexible and easy-to-use tab menu that adapts to different screen sizes by moving overflowing tab items into a "More" dropdown menu.

## Packages

This monorepo is structured using pnpm workspaces and includes the following packages:

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
*   pnpm (ensure it's installed, e.g., `npm install -g pnpm`)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd responsive-tab-menu-monorepo
    ```
2.  Install dependencies from the root directory:
    ```bash
    pnpm install
    ```
    This will install dependencies for all packages and link them using pnpm workspaces.

### Building Packages

*   To build all packages that have a `build` script:
    ```bash
    pnpm run build -r
    ```
    (The `-r` flag runs the script in each project of the workspace. The root `package.json` also has a `build` script: `"build": "npm run build -ws --if-present"`, which `pnpm run build` would execute, achieving a similar recursive build. `pnpm run build -r` is more idiomatic for pnpm.)
*   To build a specific package (e.g., `responsive-tab-menu-core`):
    ```bash
    pnpm --filter responsive-tab-menu-core build
    # or
    # cd packages/core && pnpm run build
    ```
    The `postinstall` script in the root `package.json` (triggered by `pnpm install`) automatically attempts to build the core, html, and react packages to ensure they are ready for use by the demo applications.

## Running Demo Applications

Demo applications are available in the `apps/demo/` directory to showcase the functionality of each package.

*   **HTML Demo:**
    *   Command: `pnpm --filter demo-html dev` (or `pnpm --filter demo-html start`)
    *   This will typically just print a message. Open `apps/demo/html/index.html` directly in your browser to view.

*   **React Demo (Minimal):**
    *   Command: `pnpm --filter demo-react dev`
    *   Vite will start a development server and provide a URL (e.g., `http://localhost:5173`).

*   **Mantine Demo (Feature-rich):**
    *   Command: `pnpm --filter demo-mantine dev`
    *   Vite will start a development server and provide a URL (e.g., `http://localhost:5174` or similar).

## Current Status & Known Issues (as of last build attempt)

*   **Library Packages:**
    *   The core library packages (`packages/core`, `packages/html`, `packages/react`) build successfully, including TypeScript declaration file generation.
*   **Demo Applications:**
    *   `apps/demo/react`: Currently has a build issue during the Vite build phase related to Vite's resolution of the `responsive-tab-menu-core` package.
    *   `apps/demo/mantine`: Currently has TypeScript errors (`TS7006` - implicit 'any' types in `src/App.tsx`) that prevent it from building successfully during its `tsc` phase.

## Contributing

Contributions are welcome! If you're adding features or fixing bugs, please:

1.  Ensure your changes are well-tested.
2.  If applicable, update or add a demo application in `apps/demo/` to reflect your changes.
3.  Follow the existing code style.
4.  Open a pull request with a clear description of your changes.

## License

This project is not yet licensed. A LICENSE file will be added soon (e.g., MIT License).
