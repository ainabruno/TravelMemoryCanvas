# Wanderlust Travel Photo App

## Overview

Wanderlust is a full-stack travel photo management application that allows users to organize their travel memories through trips, albums, and photos. The application provides comprehensive collaborative features including shared albums, real-time comments and reactions, activity feeds, and permission-based contributor management. Enhanced user profiles include achievements, statistics tracking, social following, and personalized settings. Features include photo upload, editing, sharing, GPS mapping, and organization with a modern, mobile-responsive interface.

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
The application uses comprehensive entities for travel organization:
- **Trips**: Travel trips with metadata (title, description, location, dates)
- **Albums**: Photo collections that can be associated with trips, including shared albums
- **Photos**: Individual photos with metadata, captions, and GPS location data
- **User Profiles**: Complete user information with social features and privacy settings
- **Collaborative Features**: Comments, reactions, activity feeds, and real-time collaboration
- **Location Tracking**: GPS coordinates, route tracking, and location analytics

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
- June 15, 2025: Initial setup with in-memory storage
- June 15, 2025: Added PostgreSQL database with persistent storage
- June 15, 2025: Improved photo upload for multiple file selection (up to 20 files)
- June 15, 2025: Optimized upload performance with progress bar and reduced file size limits
- June 15, 2025: Implemented comprehensive GPS mapping and location tracking features
- June 15, 2025: Added shared albums functionality with collaborative features
- June 15, 2025: Implemented advanced collaborative features: comments, reactions, activity feeds, and real-time collaboration sessions
- June 15, 2025: Enhanced activity feed with advanced filtering, search, and real-time notifications
- June 15, 2025: Implemented comprehensive user profile system with achievements, stats, and social features
- June 15, 2025: Enhanced comments and likes system with advanced interactions, reactions, and engagement features
- June 15, 2025: Implemented AI-powered object recognition with OpenAI GPT-4 Vision for automatic photo analysis
- June 15, 2025: Enhanced location suggestions system with intelligent recommendations based on travel history and preferences
- June 15, 2025: Completed automatic video generation system with OpenAI GPT-4 integration, 5 professional templates, intelligent photo selection, and multi-format export capabilities
- June 15, 2025: Implemented comprehensive mentoring system connecting experienced travelers with beginners, featuring mentor profiles, session scheduling, program management, and real-time communication
- June 15, 2025: Implemented granular sharing system with advanced permission control, activity tracking, link generation, analytics, templates, and password protection for precise content sharing management
- June 15, 2025: Enhanced intelligent anonymization system with OpenAI GPT-4 Vision integration, automatic person detection, privacy risk analysis, GDPR compliance, multiple anonymization modes, and smart settings optimization
- June 15, 2025: Completely redesigned home page with modern gradient hero section, enhanced statistics cards with growth indicators, quick action buttons for main features, improved navigation tabs, and French localization for better user experience
- June 15, 2025: Implemented comprehensive monetization system with multiple revenue streams including subscription management (Basic/Pro/Enterprise tiers), marketplace for digital content sales, affiliate program with commission tracking, revenue analytics dashboard, and Stripe payment integration
- June 15, 2025: Completed full French localization of the entire user interface including all monetization features, navigation, forms, error messages, and user-facing content with professional French translations and cultural adaptations
- June 15, 2025: Redesigned navigation menu with hierarchical organization into logical categories: "Mes Voyages", "IA & Création", "Social & Partage", "Confidentialité", and "Premium & Business" for improved user experience and intuitive feature discovery
- June 15, 2025: Added comprehensive footer with company information, navigation links, social media links, and trust indicators across all pages. Created reusable PageLayout component for consistent header/footer implementation throughout the application
- June 15, 2025: Fixed critical runtime errors by adding null checks for userName.slice(), authorName.slice(), and name.slice() operations across travel-groups, enhanced-photo-comments, and enhanced-likes-system components to prevent undefined reference errors
- June 17, 2025: Corrected navigation functionality issues including non-working tabs in home page, missing Albums page, inconsistent PageLayout usage across AI pages, and improved navigation menu structure with proper routing for all sections

## User Preferences

Preferred communication style: Simple, everyday language.