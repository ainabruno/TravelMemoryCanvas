# Wanderlust Travel Photo App

## Overview

Wanderlust is a full-stack travel photo management application that allows users to organize their travel memories through trips, albums, and photos. The application provides features for photo upload, editing, sharing, and organization with a modern, mobile-responsive interface.

## System Architecture

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite for build tooling
- **UI Framework**: shadcn/ui components with Tailwind CSS for styling
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless connection
- **File Upload**: Multer for handling multipart/form-data
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Deployment**: Replit with auto-scaling

### Architecture Pattern
The application follows a monorepo structure with clear separation between client, server, and shared code:
- **Client**: React SPA with component-based architecture
- **Server**: RESTful API with Express.js
- **Shared**: Common TypeScript types and database schema definitions

## Key Components

### Frontend Architecture
- **Component Structure**: Organized using shadcn/ui design system with custom travel-themed components
- **State Management**: Uses TanStack Query for server state management with optimistic updates
- **Responsive Design**: Mobile-first approach with dedicated mobile navigation
- **Photo Editing**: Client-side photo filters and adjustments using CSS filters
- **File Upload**: Drag-and-drop interface with progress tracking

### Backend Architecture
- **API Design**: RESTful endpoints following conventional HTTP methods
- **Data Storage**: Abstracted storage interface supporting both in-memory (development) and database persistence
- **File Handling**: Multer middleware for photo uploads with size and type validation
- **Error Handling**: Centralized error handling with appropriate HTTP status codes

### Database Schema
The application uses three main entities:
- **Trips**: Travel trips with metadata (title, description, location, dates)
- **Albums**: Photo collections that can be associated with trips
- **Photos**: Individual photos with metadata, captions, and location data

## Data Flow

### Photo Upload Flow
1. User drags/drops photos into upload zone
2. Files validated client-side for type and size
3. FormData sent to `/api/photos/upload` endpoint
4. Server processes files with Multer, stores in uploads directory
5. Photo metadata saved to database
6. Client state updated via TanStack Query invalidation

### Photo Management Flow
1. Photos fetched via `/api/photos` endpoint
2. Displayed in responsive grid layout
3. User interactions (edit, share) trigger modal components
4. Modifications sent to appropriate API endpoints
5. UI updated optimistically with server sync

### Trip and Album Organization
1. Trips and albums managed through dedicated API endpoints
2. Hierarchical relationship: Trips → Albums → Photos
3. Statistics aggregated server-side for dashboard display

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connection for PostgreSQL
- **drizzle-orm**: Type-safe ORM with schema validation
- **@tanstack/react-query**: Server state management
- **multer**: File upload handling
- **wouter**: Lightweight client-side routing

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **esbuild**: Server-side bundling for production

## Deployment Strategy

### Development Environment
- Uses Vite development server with HMR
- In-memory storage for rapid prototyping
- Auto-reload via nodemon equivalent (tsx)

### Production Build
- Client built with Vite to static assets
- Server bundled with esbuild for Node.js runtime
- Assets served from Express static middleware

### Replit Configuration
- **Runtime**: Node.js 20 with PostgreSQL 16
- **Auto-scaling**: Configured for dynamic scaling based on traffic
- **Port Configuration**: Internal port 5000 mapped to external port 80
- **Build Process**: npm run build → npm run start

### Database Strategy
- Development: Can use in-memory storage or local PostgreSQL
- Production: PostgreSQL via DATABASE_URL environment variable
- Schema management via Drizzle migrations in `/migrations` directory

## Changelog
- June 15, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.