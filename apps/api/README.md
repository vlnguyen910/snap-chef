# Snap Chef API

This is the backend API for the Snap Chef application, a culinary platform for sharing and discovering recipes. It is built with [NestJS](https://nestjs.com/) and provides comprehensive REST endpoints.

## Features
- **Auth:** Email, Phone OTP (Firebase), Google OAuth, Token Blacklisting.
- **Social:** User followings, dynamic newsfeed, recipe likes, and comments.
- **Docs:** Interactive API documentation via Swagger UI at `/api/docs`.
- **Security:** Global rate limiting and JWT guards.

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
