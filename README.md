# Snap Chef

Snap Chef is a money splitting and sharing application designed to make expense management easy among groups. This repository is a monorepo managed by [Turborepo](https://turbo.build/repo).

## Project Structure

This project is organized as a monorepo with the following structure:

### Apps

- **`apps/api`**: The backend API built with [NestJS](https://nestjs.com/). It handles user authentication, group management, and expense tracking logic.
- **`apps/web`**: The frontend web application built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and TypeScript. It provides the user interface for managing groups and expenses.

### Packages

- **`packages/ui`**: Shared UI component library.
- **`packages/eslint-config`**: Shared ESLint configurations.
- **`packages/typescript-config`**: Shared TypeScript configuration (`tsconfig.json`).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 18)
- [pnpm](https://pnpm.io/) (>= 9)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd snap-chef
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Development

To start the development server for all apps:

```bash
pnpm dev
```

This command will start both the API and Web applications in watch mode.

### Building

To build all apps and packages:

```bash
pnpm build
```

### Testing

To run tests across the entire monorepo:

```bash
pnpm test
```

### Linting

To lint all apps and packages:

```bash
pnpm lint
```

### Type Checking

To check types across the entire monorepo:

```bash
pnpm check-types
```
