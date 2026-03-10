# Snap Chef

Snap Chef is a culinary application for sharing and discovering recipes. It features a robust backend API and a modern frontend interface, organized as a monorepo and managed by [Turborepo](https://turbo.build/repo).

## Key Features

- **Authentication:** Email/Password, Phone OTP via Firebase, and Google OAuth2. Token blacklisting for enhanced security.
- **Social & Feed:** Dynamic newsfeed, user following, recipe likes, comments, and collections.
- **Security:** Built-in rate limiting and robust JWT authentication strategies.
- **Documentation:** Auto-generated API documentation using Swagger UI.
- **Real-time:** WebSockets integration for real-time notifications, backed by Redis.

## Project Structure

This project is organized as a monorepo with the following structure:

### Apps

- **`apps/api`**: The backend API built with [NestJS](https://nestjs.com/). It handles user authentication, recipe management, social interactions, and serves the Swagger documentation.
- **`apps/web`**: The frontend web application built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and TypeScript. It provides the user interface for discovering recipes and interacting with the community.

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
