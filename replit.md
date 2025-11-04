# Arabic-First AI Career Agent for KSA Professionals

## Overview
A conversational AI career assistant designed specifically for job seekers in Saudi Arabia. The application provides Arabic-first interface with RTL support and offers 8 specialized career pathways to help users with resume building, job applications, career planning, and interview preparation.

## Current Status
**✅ COMPLETE** - All features implemented with authentication for free launch (November 4, 2025)

## Features

### 8 Career Pathways
1. **Resume Review** (`resume_review`) - Comprehensive CV analysis with improvement suggestions
2. **Career Chat** (`career_chat`) - Open-ended professional career discussion
3. **Future Planning** (`future_plan`) - 3-6 month career roadmap with KSA market insights
4. **Tailor to Job** (`tailor_to_job`) - Job description matching + rewritten bullets
5. **Interview Prep** (`interview`) - Interview questions and preparation guidance
6. **Cover Letter** (`cover_letter`) - Custom Arabic cover letter generation
7. **Skills Gap Analysis** (`skills_gap`) - Identify and address skill gaps
8. **Build from Scratch** (`build_from_zero`) - Conversational resume creation

### Phase 2 Features (IMPLEMENTED)
- ✅ **PostgreSQL Persistence**: Sessions, messages, cards, and resumes stored in database
- ✅ **PDF Export**: Resume export using headless Chrome with RTL and Arabic fonts
- ✅ **Real-time Collaboration**: WebSocket-based collaborative editing for resume sections
- ✅ **KSA Market Data**: Salary ranges, top employers, industry trends for 8 common roles
- ✅ **Language Switching**: Toggle between Arabic and English with automatic RTL/LTR support

### Authentication & Free Launch (November 4, 2025)
- ✅ **Replit Auth Integration**: User signup/login with Google, GitHub, Apple, email/password
- ✅ **User Management**: User profiles stored in PostgreSQL
- ✅ **Free for All Users**: All 8 pathways, unlimited messages, all features completely free
- ✅ **No Usage Limits**: No restrictions on messages, reviews, or feature access
- 📱 **Apple Store Ready**: Authentication integrated for user tracking, no payment required

### Technical Features
- **Conversation Memory**: PostgreSQL-backed chat history with full context persistence
- **File Upload & Processing**: PDF/DOCX/Image support with OCR (Tesseract.js)
- **Resume Parsing**: Strict JSON extraction with Arabic error messages
- **AI-Powered Rewriting**: Bullets ≤20 words in Arabic with action verbs
- **Job Description Matching**: Gap analysis and tailoring recommendations
- **Export Formats**: DOCX and PDF with RTL-aware document generation
- **Multi-tone Support**: Professional Arabic (default) + light Najdi dialect (on request)
- **WebSocket Collaboration**: Real-time resume editing with multiple users
- **Language Switching**: Arabic/English toggle with localStorage persistence and automatic RTL/LTR direction updates

## Architecture

### Frontend (`client/`)
- **Framework**: React + Wouter routing + TanStack Query
- **UI**: Shadcn components with Material Design principles
- **Typography**: IBM Plex Sans Arabic (Arabic), Inter (Latin fallback)
- **RTL Support**: Full right-to-left layout and text direction
- **State**: PostgreSQL-backed with localStorage sync
- **Collaboration**: WebSocket hook for real-time editing

Key Components:
- `Home.tsx` - Main page with pathway selection and chat interface
- `OptionCards.tsx` - 8 career pathway option cards
- `ChatInterface.tsx` - Conversational UI with message history
- `MessageBubble.tsx` - RTL-aware message display
- `ChatInput.tsx` - Message input with file upload
- `OutputCard.tsx` - Generated content cards (resumes, plans, etc.)
- `FileUploadDialog.tsx` - Multi-format file upload
- `LanguageSwitcher.tsx` - Language toggle component (Arabic/English)
- `contexts/LanguageContext.tsx` - Language state management and translation provider
- `lib/translations.ts` - Translation keys for Arabic and English
- `hooks/useCollaboration.ts` - WebSocket collaboration hook

### Backend (`server/`)
- **Framework**: Express.js
- **AI**: Google Gemini Flash 2.5 via Replit AI Integrations
- **Storage**: PostgreSQL with Drizzle ORM
- **File Processing**: pdf-parse, mammoth (DOCX), Tesseract.js (OCR)
- **Export**: Puppeteer for PDF, docx for DOCX
- **WebSocket**: ws package for real-time collaboration

Key Modules:
- `routes.ts` - API endpoints + pathway-specific card generation
- `llmClient.ts` - Gemini integration with exponential backoff retry logic
- `prompts.ts` - System prompts for all 8 pathways
- `tools.ts` - File extraction, resume parsing, bullet rewriting, JD scoring, PDF/DOCX export
- `storage.ts` - PostgreSQL session and conversation management
- `websocket.ts` - Real-time collaborative editing server

### Shared (`shared/`)
- `schema.ts` - TypeScript types, Zod schemas, and Drizzle database tables

## Database Schema

### Tables
- **sessions**: Session metadata (id, resumeJson, tone, targetJob, jdText, language, timestamps)
- **messages**: Chat messages (id, sessionId, role, content, timestamp)
- **cards**: Generated output cards (id, sessionId, messageId, type, title, content, metadata)
- **savedResumes**: Saved resume versions (id, sessionId, name, resumeJson, version, targetRole)

All tables use proper foreign keys with cascade deletion for data integrity.

## API Endpoints

### Chat
- `POST /api/chat` - Main conversational endpoint with full history context

### File Processing
- `POST /api/tools/extract_text` - Extract text from PDF/DOCX/images
- `POST /api/tools/parse_resume_json` - Parse resume to strict JSON
- `POST /api/tools/rewrite_bullets_ar` - Rewrite experience bullets
- `POST /api/tools/recommend_path_ksa` - Generate career roadmap
- `POST /api/tools/score_vs_jd` - Match resume against job description
- `POST /api/tools/export` - Export to DOCX or PDF with RTL support

### WebSocket
- `ws://localhost:5000/ws/collaborate` - Real-time collaborative editing
  - join, leave, resume_update, cursor_move events
  - Room-based collaboration (sessions as rooms)
  - Auto-reconnection support

## KSA Market Data

Expanded data for 8 common roles including:
- **Entry Level**: Customer Service (4-6K SAR), Data Entry (3.5-5.5K), Administrative Assistant (4.5-7K)
- **Junior Level**: Data Analyst (6-9K), Digital Marketing (5.5-8.5K)
- **Mid Level**: Software Developer (10-18K), Accountant (7-12K)
- **Senior Level**: Project Manager (15-30K)

Each role includes:
- Salary ranges in SAR
- Top employers in KSA
- Industry trends
- Growth indicators (high/medium/stable)

## Known Issues & Limitations

1. **In-Production**: Real-time collaboration requires active WebSocket connection

## Recent Fixes (November 4, 2025)

### PDF Text Extraction Fix
- **Issue**: PDF uploads were failing with "فشل استخراج النص من الملف" error
- **Root Cause**: Code was using pdf-parse V1 API but V2.4.5 was installed (class-based API)
- **Fix Applied**: Updated extractText() to use pdf-parse V2 API:
  - Changed from `pdf_parse(buffer)` to `new PDFParse({ data: buffer }).getText()`
  - Updated import to `import { PDFParse } from "pdf-parse"`
- **Status**: ✅ PDF, DOCX, and image uploads now working correctly

### Resume Data Integration Fix
- **Issue**: PDFs were being uploaded and parsed, but the resume JSON was never sent to the chat session
- **Root Cause**: Callback chain was incomplete - FileUploadDialog had no way to notify parent about parsed resume
- **Fix Applied**: 
  - Added `onUploadComplete` callback to FileUploadDialog that receives parsed resumeJson
  - Updated ChatInput to pass `onResumeUploaded` callback through
  - Updated ChatInterface to propagate callback
  - Modified Home.tsx to accept `resumeJsonOverride` parameter in handleSendMessage (avoids async state issues)
  - Resume JSON now passed directly to first request + stored in state for subsequent messages
- **Status**: ✅ Resume data flows from upload → parse → chat session → backend storage
- **Verification**: E2E test confirms assistant receives resume context and asks relevant questions

### Migration from OpenAI to Google Gemini (November 4, 2025)
- **Issue**: OpenAI GPT-5 was returning empty responses intermittently, causing career pathway features to fail
- **Root Cause**: Suspected rate limiting or quota issues with OpenAI service
- **Fix Applied**:
  - Migrated from OpenAI SDK to Google Gemini SDK (@google/genai)
  - Using gemini-2.5-flash model via Replit AI Integrations (free, no API key needed)
  - Implemented message format conversion (system messages prepended to first user message)
  - Added robust retry logic with p-retry for rate limit errors (7 retries, exponential backoff)
  - Preserved error metadata for retry detection (status codes, isRateLimit flag)
  - Added temperature passthrough for tuning flexibility
  - Fixed system message handling for mid-conversation context
- **Benefits**:
  - ✅ No more empty responses - Gemini is highly reliable
  - ✅ Better Arabic language support
  - ✅ Faster responses with flash model
  - ✅ Still completely free via Replit AI Integrations
- **Status**: ✅ All 8 career pathways working smoothly with Gemini
- **Verification**: E2E tests confirm Arabic responses, resume reviews, and all pathways functional

## Development Guidelines

- **Arabic-first**: All user-facing text in Arabic unless explicitly Latin content
- **RTL everywhere**: Use `dir="rtl"` and ensure proper text alignment
- **IBM Plex Sans Arabic**: Primary font for all Arabic text
- **Material Design**: Follow design_guidelines.md for colors, spacing, components
- **PostgreSQL**: All data persists to database with proper ordering
- **WebSocket**: Validate session membership before broadcasting
- **Error handling**: Provide Arabic error messages
- **Logging**: Console logs for debugging (LLM calls, empty responses, errors)
- **Authentication**: Replit Auth with OpenID Connect for user management
- **Free Access**: All features available to all users without payment or limits

## Testing

E2E testing confirmed:
- ✅ Home page displays all 8 pathway options
- ✅ Chat interface works with conversation memory
- ✅ Gemini LLM returns reliable Arabic responses with excellent quality
- ✅ RTL layout and typography rendering correctly
- ✅ Database persistence works (sessions + messages)
- ✅ PDF export functional with RTL support
- ✅ All 8 career pathways tested and working

## Recent Changes (November 3, 2025)

### Phase 1 (MVP)
1. Fixed conversation memory - messages now properly stored and passed to LLM
2. Implemented all 8 pathway handlers with card generation
3. Added interview pathway with generateInterviewPrep()
4. Added build_from_zero pathway (conversational)
5. Fixed tailor_to_job to generate both JD match AND rewritten bullets cards
6. Added fallback error message for empty LLM responses
7. Added debug logging throughout for troubleshooting

### Phase 2 (Current)
1. **Database Persistence**:
   - Migrated from in-memory to PostgreSQL storage
   - Created 4 tables with proper foreign keys
   - Implemented proper message ordering
   - Fixed database driver (pg instead of neon-serverless)

2. **PDF Export**:
   - Added Puppeteer-based PDF generation
   - RTL support with IBM Plex Sans Arabic font
   - A4 format with proper margins
   - Browser cleanup via try/finally

3. **Real-time Collaboration**:
   - WebSocket server with room-based collaboration
   - Session validation to prevent cross-session spoofing
   - Auto-reconnection in React hook
   - Proper cleanup on session switch

4. **KSA Market Data**:
   - Expanded role database from 5 to 8 roles
   - Added salary ranges for all roles
   - Included top employers for each position
   - Added industry trends and growth indicators
   - Ready for integration with career planning features

5. **Language Switching**:
   - Created translation system with Arabic and English support
   - Implemented LanguageContext for state management
   - Added LanguageSwitcher component with dropdown UI
   - Updated all components to use translation keys
   - Automatic RTL/LTR direction switching
   - localStorage persistence for language preference

## Running the Application

```bash
npm run dev
```

Starts Express server (backend) and Vite dev server (frontend) on port 5000.

## Environment Variables

Required (set via Replit AI Integrations):
- `AI_INTEGRATIONS_GEMINI_BASE_URL`
- `AI_INTEGRATIONS_GEMINI_API_KEY`
- `DATABASE_URL`

Available:
- `SESSION_SECRET`
- Object storage vars (if needed)

## Future Enhancements

- Batch processing for multiple resume versions targeting different roles
- User authentication system
- Analytics and usage tracking
- Support for English interface toggle
- Mobile app version
- Enhanced error handling and retry logic
- Browser-pooling for PDF export optimization
