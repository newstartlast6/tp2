# TractionPilot

## Overview

TractionPilot is a Next.js web application designed to help users share and showcase their projects with Gentura agents. The application features a simple onboarding interface where users can submit their project URLs for evaluation or analysis. Built with modern React patterns and styled with Tailwind CSS, it provides a clean, user-friendly experience with a distinctive dark gradient theme.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application follows Next.js 15 App Router architecture with React 19, utilizing a component-based design pattern. The main interface is built as a single-page onboarding form with client-side interactivity for URL submission. The project uses TypeScript for type safety and maintains a clean separation between UI components and business logic.

### UI Component System
The application implements a comprehensive design system based on Radix UI primitives and shadcn/ui components. This provides a consistent, accessible component library including forms, dialogs, buttons, and navigation elements. The components are styled using Tailwind CSS with custom CSS variables for theming, supporting both light and dark modes through next-themes integration.

### Styling and Theming
The styling architecture uses a modern CSS approach with Tailwind CSS as the primary framework, enhanced with custom CSS variables for dynamic theming. The application features a distinctive radial gradient background and implements a cohesive color system that can adapt to different themes. Font optimization is handled through Next.js font loading with Geist Sans and Geist Mono typefaces.

### State Management
The application uses React's built-in state management with hooks for simple form interactions and component state. The current implementation focuses on client-side form handling for URL submission, with state managed locally within components.

### Development Configuration
The project is configured with TypeScript for type safety, ESLint for code quality, and includes path aliases for clean imports. The development setup supports hot reloading and includes proper TypeScript configuration for Next.js App Router patterns.

## External Dependencies

### Core Framework Dependencies
- **Next.js 15.5.2**: React framework providing App Router, server-side rendering, and build optimization
- **React 19.1.0**: Core React library for component-based UI development
- **TypeScript**: Static type checking and enhanced development experience

### UI and Component Libraries
- **Radix UI Components**: Comprehensive set of accessible, unstyled UI primitives including dialogs, forms, navigation, and interactive elements
- **shadcn/ui**: Pre-built component system built on Radix UI with consistent styling patterns
- **Lucide React**: Icon library providing consistent iconography throughout the application
- **class-variance-authority**: Utility for creating component variants with conditional styling

### Styling and Animation
- **Tailwind CSS**: Utility-first CSS framework for responsive design and component styling
- **next-themes**: Theme management system supporting light/dark mode switching
- **clsx & tailwind-merge**: Utilities for conditional class management and Tailwind class merging

### Form and Interaction Libraries
- **React Hook Form**: Form state management and validation library
- **@hookform/resolvers**: Validation resolvers for React Hook Form integration
- **input-otp**: Specialized component for OTP/PIN input functionality
- **cmdk**: Command palette and search interface components

### Additional UI Enhancements
- **embla-carousel-react**: Carousel/slider component for content presentation
- **react-day-picker**: Date picker component with internationalization support
- **date-fns**: Date utility library for formatting and manipulation
- **sonner**: Toast notification system for user feedback

### Development Tools
- **Geist Fonts**: Optimized font loading through Next.js font system
- **CSS Custom Properties**: Dynamic theming system using CSS variables