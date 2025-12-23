# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Recipe creation and editing functionality with image upload support
- User profile page with stats display
- Moderation queue system for recipe approval/rejection
- Authentication system with JWT tokens
- Global state management using Zustand
- Recipe ingredients and steps management
- User dashboard with recipe stats and recent activities
- Responsive navigation header with user menu
- Toast notifications for user feedback

### Changed
- Improved axios configuration with automatic token handling
- Enhanced recipe update API to use PATCH method
- Updated form validation for recipe creation/editing
- Refactored authentication context for better state management

### Fixed
- Recipe update API endpoint now correctly uses recipe ID
- Form data validation for numeric fields (servings, cooking_time)
- User authentication state persistence across page reloads
- Mobile navigation menu toggle functionality

## [1.0.0] - 2024-12-21

### Added
- Initial project setup with monorepo structure using pnpm workspaces
- NestJS API backend with Prisma ORM
- React frontend with Vite and TypeScript
- PostgreSQL database schema for recipes, users, and ingredients
- Basic CRUD operations for recipes
- User authentication endpoints
- Recipe moderation workflow
- Tailwind CSS styling with custom components
- Docker Compose configuration for local development

[Unreleased]: https://github.com/yourusername/snap-chef/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/snap-chef/releases/tag/v1.0.0