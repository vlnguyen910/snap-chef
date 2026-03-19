# Snap Chef API

## Project Overview

This is the backend API for **Snap Chef**, a culinary application for sharing and discovering recipes. It is built using **NestJS** and provides a robust set of features including user authentication, recipe management, social interactions (likes, comments, follows), collections, and real-time notifications.

## Technical Stack

- **Framework:** [NestJS](https://nestjs.com/) (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** [Prisma](https://www.prisma.io/)
- **Caching & WebSockets:** Redis (via `ioredis` and `socket.io-redis`)
- **Authentication:** JWT, Google OAuth2 (Passport)
- **Validation:** `class-validator`, `class-transformer`
- **Package Manager:** pnpm

## Key Features & Architecture

- **Authentication:** Local (Email/Password) and OAuth (Google). Handles login, registration, email verification, and token management.
- **Users:** Profile management, follow/unfollow functionality.
- **Recipes:** Full CRUD for recipes, including ingredients, cooking steps, and status (Draft, Published, etc.).
- **Interactions:** Likes, Comments, and Collections.
- **Notifications:** Real-time system using WebSockets (Gateway) backed by Redis.
- **Search:** Database indexing on key fields (usernames, recipe titles, ingredients).

## Development Guide

### Prerequisites

- Node.js (>= 18)
- pnpm
- PostgreSQL
- Redis

### Setup

1.  **Install Dependencies:**
    ```bash
    pnpm install
    ```
2.  **Environment Configuration:**
    Copy `.env-example` to `.env` and populate variables (DB credentials, Redis host, JWT secrets, OAuth keys).
    ```bash
    cp .env-example .env
    ```
3.  **Database Migration:**
    ```bash
    npx prisma migrate dev
    ```

### Running the Application

- **Development (Watch Mode):**
  ```bash
  pnpm run dev
  ```
- **Production Build:**
  ```bash
  pnpm run build
  pnpm run start:prod
  ```

### Testing

- **Unit Tests:** `pnpm run test`
- **E2E Tests:** `pnpm run test:e2e`
- **Coverage:** `pnpm run test:cov`

### Code Quality

- **Linting:** `pnpm run lint`
- **Type Checking:** `pnpm run check-types`
- **Formatting:** `pnpm run format`

## Directory Structure

- `src/common`: Shared utilities, guards, decorators, and constants.
- `src/config`: Application configuration files.
- `src/modules`: Feature-specific modules (Auth, Recipes, Users, etc.).
- `prisma`: Database schema and migrations.
- `test`: E2E test configuration and specs.

## Database Schema Highlights

- **User:** Roles (User, Moderator, Admin), Auth provider linkage.
- **Recipe:** Status workflow (Draft -> Published), linked to Ingredients and Steps.
- **Interactions:** Many-to-Many relations for Likes, Follows, and Collections.
