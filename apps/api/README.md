# Snap Chef API

This is the backend API for the Snap Chef application, built with [NestJS](https://nestjs.com/).

## Getting Started

### Prerequisites

- Node.js (>= 18)
- pnpm

### Environment Variables

Copy the example environment file and configure it:

```bash
cp .env-example .env
```

Make sure to set the necessary database credentials and other configuration options in `.env`.

### Installation

```bash
pnpm install
```

### Running the App

```bash
# development
pnpm run start

# watch mode
pnpm run dev

# production mode
pnpm run start:prod
```

### Test

```bash
# unit tests
pnpm run test

# e2e tests
pnpm run test:e2e

# test coverage
pnpm run test:cov
```

### Type Checking

```bash
pnpm run check-types
```
