# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Graphite is a multimodal AI chat application MVP built with:
- **Backend**: Python FastAPI with Prisma ORM and PostgreSQL
- **Frontend**: React 18 + TypeScript with Vite
- **Architecture**: Full-stack web app focused on chat functionality

## Essential Commands

### Development Startup
```bash
./start.sh  # Start both backend (port 8001) and frontend (port 5173)
```
This is the primary development command. It automatically:
- Sets up Python virtual environment (`backend/venv/`)
- Generates Prisma client
- Starts both services with proper cleanup on exit

### Backend Development
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001  # Direct backend start
python -m prisma generate  # After schema changes
```

### Frontend Development
```bash
cd frontend
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run preview --port 4173  # Preview build
```

## Architecture & Code Organization

### Backend Structure (`backend/app/`)
- `main.py` - FastAPI entry point with CORS and health endpoints
- `core/` - Configuration and database setup
- `routes/` - API endpoint definitions (currently `/api/chat`)
- `services/` - Business logic layer
- `models/` - Data models via Prisma schema

### Frontend Structure (`frontend/src/`)
- `main.tsx` - React entry point
- `pages/` - Page components
- Built with Vite for fast development and optimized builds

### Database
- PostgreSQL with Prisma ORM (`prisma-client-py`)
- Schema: `backend/prisma/schema.prisma`
- Models: `ChatSession` and `Message` with proper relationships
- Uses `cuid()` for IDs and cascade deletes

## Development Workflow

### After Making Changes
1. **Start Services**: Verify `./start.sh` works without errors
2. **Test Endpoints**: Check `/health` and `/ready` endpoints
3. **TypeScript**: Ensure frontend compiles without errors
4. **Build Check**: Run `npm run build` in frontend for production builds

### Database Schema Changes
1. Edit `backend/prisma/schema.prisma`
2. Run `python -m prisma generate` to update client
3. Handle migrations appropriately for your environment

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGIN` - Frontend URL for CORS configuration

## Code Conventions

### File Documentation
Each file includes a header with purpose, dependencies, and metadata:
```python
'''
File: app/main.py
Purpose: FastAPI entry point for Graphite MVP
Dependencies: fastapi
Imports: FastAPI, CORSMiddleware, settings
Exports: app (FastAPI application)
Created: 2025-09-05
'''
```

### API Patterns
- Router-based organization with prefixes and tags
- Standard health endpoints (`/health`, `/ready`)
- CORS configured via settings

### Database Patterns
- Proper model relationships with cascade deletes
- Timestamp fields (`createdAt`, `updatedAt`)
- Enum types for constrained values (`MessageRole`)

## Current Limitations (MVP Stage)

This is an early-stage MVP. The following are not yet implemented:
- Testing framework (Jest, Vitest, pytest)
- Linting/formatting (ESLint, Prettier, Black)
- CI/CD pipelines
- Comprehensive error handling
- Authentication/authorization
- Rate limiting
- Input validation schemas

## Technology Stack Details

### Backend Dependencies
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `prisma` - Database ORM
- `pydantic` - Data validation
- `openai` - AI integration
- `chromadb` - Vector storage
- `boto3` - AWS services

### Frontend Dependencies  
- `react` - UI framework
- `typescript` - Type safety
- `vite` - Build tool and dev server

## Health Monitoring

- Backend: `GET /health` and `GET /ready`
- Manual verification of core functionality required
- No automated health checks configured yet