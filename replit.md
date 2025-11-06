# Mehnaty AI | مهنتي

## Overview
This project is a conversational AI career assistant tailored for job seekers in the Arabic-speaking world and the broader MENA region. It provides a bilingual Arabic/English interface with full right-to-left (RTL) and left-to-right (LTR) support. The application offers 8 specialized career pathways designed to assist users with resume building, job applications, career planning, and interview preparation. The business vision is to provide a comprehensive, accessible, and free career guidance tool to professionals in the MENA region, leveraging AI to overcome common job search hurdles.

## User Preferences
I prefer simple language.
I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The application features a bilingual Arabic/English interface with full RTL/LTR support, utilizing Shadcn components based on Material Design principles. The primary font for Arabic text is IBM Plex Sans Arabic, with Inter as a Latin fallback. All UI components, including file upload dialogs, are fully localized.

### Technical Implementations
- **Frontend**: Built with React, Wouter for routing, and TanStack Query for data management. It includes a WebSocket hook for real-time collaborative editing.
- **Backend**: Uses Express.js, integrating Google Gemini Flash 2.5 via Replit AI Integrations for AI capabilities. PostgreSQL with Drizzle ORM handles data storage.
- **File Processing**: Supports PDF, DOCX, and image uploads, with OCR powered by Tesseract.js.
- **Resume Parsing**: Extracts resume data into a strict JSON format, with Arabic error messages.
- **AI-Powered Rewriting**: Rewrites resume bullets to be concise (≤20 words) and action-oriented in Arabic.
- **Export Formats**: Generates DOCX and PDF documents with full RTL support using Puppeteer for PDF and `docx` for DOCX.
- **Real-time Collaboration**: Implements WebSocket-based collaborative editing for resume sections.
- **Language Switching**: Provides a seamless Arabic/English toggle with automatic RTL/LTR adjustment and `localStorage` persistence for user preference.
- **Conversation Memory**: Utilizes PostgreSQL for persistent chat history and full context.
- **KSA Market Data**: Incorporates detailed market insights for 8 common roles, including salary ranges, top employers, industry trends, and growth indicators.

### Feature Specifications
- **8 Career Pathways**: Resume Review, Career Chat, Future Planning, Tailor to Job, Interview Prep, Cover Letter, Skills Gap Analysis, and Build from Scratch.
- **Enhanced Resume Review**: After analyzing uploaded resumes (strengths, weaknesses, suggestions), the AI proactively asks about career goals and future aspirations, providing personalized advice and 3-6 month action plans. The conversational approach mimics a professional career coach.
- **Optional Authentication**: Integrates Replit Auth for optional user signup/login (Google, GitHub, Apple, email/password). Users can access all features as guests or sign in for enhanced benefits:
  - **Guest Mode**: Immediate access with temporary session storage (sessionId-based)
  - **Authenticated Mode**: Permanent data storage, cross-device access, profile management, and enhanced personalization
  - **Session Migration**: When guests sign in, their temporary session data is automatically linked to their user account
- **User Profile Management**: Authenticated users can manage their profile including phone, LinkedIn URL, current role, years of experience, industry, and skills
- **Accessibility**: All features are free and without usage limits for both guests and authenticated users.
- **Modern Standard Arabic**: Ensures professional Modern Standard Arabic (MSA) is used throughout the application, avoiding regional dialects.

### System Design Choices
- **Database Schema**: PostgreSQL tables (`sessions`, `messages`, `cards`, `savedResumes`, `users`, `subscriptions`, `usageTracking`) with proper foreign keys and cascade deletion for data integrity. Sessions table includes optional `userId` field for linking guest sessions to authenticated users.
- **Hybrid Session Management**: 
  - Guest users: sessionId stored in localStorage, temporary data
  - Authenticated users: sessions linked to userId in database, permanent storage
  - Session migration: `/api/auth/link-session` endpoint automatically links guest sessions to user accounts upon sign-in
  - Frontend migration logic: Uses `syncedSessionKey` state to track completed syncs per user+session combination
  - Performance optimization: Migration effect runs once per unique user+session (prevents continuous re-firing on message changes)
  - Data flow: localStorage loads → discover existing sessions → link current session → sync with backend (backend is authoritative)
  - Backend as source of truth: Always overwrites local state with backend data after authentication
- **API Endpoints**: 
  - `POST /api/chat` for conversational interactions
  - `POST /api/tools/*` for file processing, resume parsing, bullet rewriting, JD scoring, and export
  - `GET /api/auth/user` for fetching authenticated user data
  - `GET /api/auth/profile` for fetching user profile
  - `POST /api/auth/profile` for updating user profile
  - `POST /api/auth/link-session` for migrating guest sessions to authenticated users
  - `GET /api/auth/sessions` for discovering user's existing sessions (auth-required)
  - `GET /api/sessions/:sessionId` for fetching session data (messages, cards) for cross-device sync
- **WebSocket Endpoint**: `ws://localhost:5000/ws/collaborate` for real-time collaborative editing with room-based collaboration and auto-reconnection.

## External Dependencies
- **AI Integration**: Google Gemini Flash 2.5 (via Replit AI Integrations)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Frontend Framework**: React
- **Routing**: Wouter
- **Data Fetching**: TanStack Query
- **UI Components**: Shadcn
- **PDF Parsing**: `pdf-parse`
- **DOCX Parsing**: `mammoth`
- **OCR**: Tesseract.js
- **PDF Generation**: Puppeteer
- **DOCX Generation**: `docx` package
- **WebSockets**: `ws` package
- **Authentication**: Replit Auth (integrated with Google, GitHub, Apple)