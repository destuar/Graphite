# Graphite: AI Chat + Knowledge Management System

## System Overview

**Graphite** is an intelligent knowledge management and AI chat platform that combines ChatGPT-style conversational AI with advanced document management and semantic search. The system provides a dual-interface experience: a clean chat interface with conversation history, and a powerful knowledge repository with interactive graph visualization.

### Core Features
- **ChatGPT-like Interface**: Clean chat UI with conversation history sidebar
- **Knowledge Repository**: Upload and manage multimedia content (PDFs, images, videos, Excel, text files)
- **Semantic Graph Visualization**: Interactive content web based on semantic relationships
- **Advanced RAG System**: Multi-modal retrieval using lexical, semantic, and symbolic search
- **Query Enhancement**: Query rewriting and fanout for improved search performance

### Design Principles
- **Minimize moving parts**: Build the smallest viable system first; introduce specialized infra only when justified.
- **Single source of truth**: Keep authoritative data in PostgreSQL; add external stores as read-optimized indexes.
- **Clear boundaries**: Routes → services → adapters → stores. Pure functions for business logic where practical.
- **Configuration-driven**: All provider and feature choices via environment variables and a central config.
- **Observability-first**: Structured logs, health/readiness endpoints, and tracing hooks from day one.

### Architecture Stack
- **Backend**: Python (FastAPI + Pydantic AI) + Prisma (Python)
- **Frontend**: React + TypeScript + Tailwind CSS + D3.js/Vis.js
- **Database**: PostgreSQL with Prisma ORM
- **Vector Store**: ChromaDB (MVP). Alternative path: pgvector in PostgreSQL if we prefer one DB.
- **Graph Store**: PostgreSQL tables (MVP). Optional Neo4j when traversal complexity/scale demands it.
- **Search Engine**: Elasticsearch for lexical search
- **LLM Providers**: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), Perplexity (router-based)
- **File Storage**: AWS S3 for document storage
- **Streaming**: Server-Sent Events (SSE)
- **State Management**: React Context + Zustand
- **Observability**: Structured logging, health endpoints; optional OpenTelemetry later

## Architecture Decision Records (Summary)

- **ADR-001: Vector store choice**
  - Decision: Use ChromaDB in MVP for speed-of-build and local development. Revisit pgvector or a managed vector DB if scale, replication, or transactional coupling merits it.
  - Criteria to revisit: dataset > 5M chunks, multi-tenant isolation, strict ACID coupling to RDBMS, cross-region replication.
- **ADR-002: Graph store choice**
  - Decision: Model nodes/edges in PostgreSQL for MVP. Adopt Neo4j only when we need heavy graph traversal (k-hop queries, pathfinding, community detection) that RDBMS indexing cannot satisfy with acceptable latency.
  - Migration plan: Keep an abstract `GraphService` API so we can swap storage without touching calling services.
- **ADR-003: Multi-LLM provider routing**
  - Decision: Introduce an `LLMRouter` with provider adapters (OpenAI, Anthropic, Gemini, Perplexity). Provider and model are chosen per-request or per-session via config/headers.
  - Rationale: Enables fast model A/B, cost/quality tradeoffs, and fallbacks without touching business logic.

## File Documentation Standard

Every file must include a header comment block following this template:

```python
'''
File: filename.py
Purpose: Brief description of what this file does and its role in the system
Dependencies: List of external dependencies and internal modules
Imports: Key imports and their purposes
Exports: Functions, classes, and variables exported by this module
Created: Date
Last Modified: Date
'''
```

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend (React)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │   Chat Interface│    │  Knowledge Repo │    │   Graph Visualization   │  │
│  │   - Chat Window │    │  - File Upload  │    │   - Semantic Graph      │  │
│  │   - History     │    │  - File Manager │    │   - Interactive Nodes   │  │
│  │   - Streaming   │    │  - Search       │    │   - Relationship Links  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API Gateway (FastAPI)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Chat Routes │  │ File Routes │  │RAG Routes   │  │ Graph Routes        │ │
│  │ /api/chat   │  │ /api/files  │  │/api/search  │  │ /api/graph          │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Service Layer                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│ │Chat Service  │ │File Service  │ │Search Service│ │Graph Service        │  │
│ │- AI Agent    │ │- Upload      │ │- RAG Pipeline│ │- Semantic Analysis  │  │
│ │- Streaming   │ │- Processing  │ │- Multi-Search│ │- Relationship Graph │  │
│ │- History     │ │- Metadata    │ │- QueryRewrite│ │- Node Generation    │  │
│ └──────────────┘ └──────────────┘ └──────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Data Layer                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│ │PostgreSQL    │ │Vector DB     │ │Elasticsearch │ │File Storage         │  │
│ │- Chat History│ │- Embeddings  │ │- Full Text   │ │- S3                 │  │
│ │- File Meta   │ │- Semantic    │ │- Lexical     │ │- Document Store     │  │
│ │- User Data   │ │- Search      │ │- Search      │ │- Media Assets       │  │
│ └──────────────┘ └──────────────┘ └──────────────┘ └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Project Structure

### Backend Structure (Python + Prisma)
```
backend/
├── prisma/
│   ├── schema.prisma           # Enhanced database schema with knowledge management
│   └── migrations/             # Database migrations
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # Prisma client setup + Vector DB connections
│   │   ├── dependencies.py    # FastAPI dependency injection
│   │   ├── storage.py         # S3/MinIO file storage configuration
│   │   └── search_engines.py  # Elasticsearch and Vector DB setup
│   ├── models/
│   │   ├── __init__.py
│   │   ├── chat.py           # Chat and conversation models
│   │   ├── document.py       # Document and file models
│   │   ├── knowledge.py      # Knowledge graph and semantic models
│   │   ├── search.py         # Search request/response models
│   │   └── streaming.py      # Streaming response models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ai_agent.py       # Enhanced Pydantic AI with RAG integration
│   │   ├── chat_service.py   # Chat business logic with RAG
│   │   ├── file_service.py   # File upload, processing, and management
│   │   ├── search_service.py # Multi-modal search orchestration
│   │   ├── rag_service.py    # RAG pipeline implementation
│   │   ├── graph_service.py  # Knowledge graph generation and analysis
│   │   ├── embedding_service.py # Vector embeddings and semantic search
│   │   └── streaming_service.py # SSE streaming logic
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── chat.py           # Chat API endpoints with RAG
│   │   ├── files.py          # File upload and management endpoints
│   │   ├── search.py         # Search and RAG endpoints
│   │   ├── knowledge.py      # Knowledge graph endpoints
│   │   ├── history.py        # Chat history endpoints
│   │   └── health.py         # Health check endpoints
│   ├── processors/
│   │   ├── __init__.py
│   │   ├── pdf_processor.py  # PDF text extraction and chunking
│   │   ├── image_processor.py # Image analysis and OCR
│   │   ├── video_processor.py # Video processing and transcription
│   │   ├── excel_processor.py # Excel/CSV data extraction
│   │   └── text_processor.py # Text file processing and chunking
│   └── utils/
│       ├── __init__.py
│       ├── logger.py         # Logging configuration
│       ├── validators.py     # Custom validation functions
│       ├── embeddings.py     # Embedding generation utilities
│       ├── chunking.py       # Document chunking strategies
│       └── graph_builder.py  # Graph construction utilities
├── requirements.txt           # Python dependencies
└── pyproject.toml            # Project configuration
```

### Frontend Structure (React + TypeScript + D3.js)
```
frontend/
├── src/
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatInterface.tsx      # Main chat container with RAG integration
│   │   │   ├── MessageList.tsx        # Message display with source references
│   │   │   ├── MessageInput.tsx       # User input with search suggestions
│   │   │   ├── StreamingMessage.tsx   # Real-time message streaming
│   │   │   ├── TypingIndicator.tsx    # Typing animation
│   │   │   └── SourceReferences.tsx   # RAG source citations display
│   │   ├── Knowledge/
│   │   │   ├── KnowledgeHub.tsx       # Main knowledge management interface
│   │   │   ├── FileUpload.tsx         # Drag-drop file upload component
│   │   │   ├── FileManager.tsx        # File list and management
│   │   │   ├── SearchInterface.tsx    # Knowledge search with filters
│   │   │   ├── ContentViewer.tsx      # Document preview and viewer
│   │   │   └── MetadataEditor.tsx     # Edit file metadata and tags
│   │   ├── Graph/
│   │   │   ├── SemanticGraph.tsx      # Interactive knowledge graph
│   │   │   ├── GraphCanvas.tsx        # D3.js graph visualization
│   │   │   ├── NodeDetails.tsx        # Node information panel
│   │   │   ├── GraphControls.tsx      # Graph navigation controls
│   │   │   ├── FilterPanel.tsx        # Graph filtering options
│   │   │   └── GraphLegend.tsx        # Graph legend and help
│   │   ├── Sidebar/
│   │   │   ├── ChatHistory.tsx        # Chat history sidebar
│   │   │   ├── SessionItem.tsx        # Individual session display
│   │   │   ├── SearchHistory.tsx      # History search functionality
│   │   │   ├── NewChatButton.tsx      # New chat creation
│   │   │   └── KnowledgeTree.tsx      # Knowledge hierarchy navigation
│   │   ├── Layout/
│   │   │   ├── AppLayout.tsx          # Main dual-pane layout
│   │   │   ├── Header.tsx             # Navigation header with tabs
│   │   │   ├── TabNavigation.tsx      # Chat/Knowledge tab switcher
│   │   │   ├── Sidebar.tsx            # Context-aware sidebar
│   │   │   └── ResizablePanes.tsx     # Resizable layout panes
│   │   ├── Search/
│   │   │   ├── UniversalSearch.tsx    # Global search component
│   │   │   ├── SearchResults.tsx      # Multi-modal search results
│   │   │   ├── SearchFilters.tsx      # Advanced search filters
│   │   │   └── SearchSuggestions.tsx  # Query suggestions and autocomplete
│   │   └── Common/
│   │       ├── LoadingSpinner.tsx     # Loading states
│   │       ├── ErrorBoundary.tsx      # Error handling
│   │       ├── Toast.tsx              # Notification system
│   │       ├── Modal.tsx              # Modal dialog component
│   │       └── ProgressBar.tsx        # File upload progress
│   ├── hooks/
│   │   ├── useStreaming.ts            # Enhanced SSE streaming with RAG
│   │   ├── useChatHistory.ts          # History management
│   │   ├── useFileUpload.ts           # File upload and processing
│   │   ├── useKnowledgeGraph.ts       # Graph data and interactions
│   │   ├── useSearch.ts               # Multi-modal search operations
│   │   ├── useLocalStorage.ts         # Browser storage
│   │   ├── useDebounce.ts             # Input debouncing
│   │   └── useWebSocket.ts            # Real-time graph updates
│   ├── services/
│   │   ├── api.ts                     # Enhanced API client
│   │   ├── streaming.ts               # SSE event handling
│   │   ├── fileService.ts             # File operations API
│   │   ├── knowledgeService.ts        # Knowledge graph API
│   │   ├── searchService.ts           # Search and RAG API
│   │   └── storage.ts                 # Local storage utilities
│   ├── store/
│   │   ├── chatStore.ts               # Enhanced chat state with RAG
│   │   ├── knowledgeStore.ts          # Knowledge management state
│   │   ├── graphStore.ts              # Graph visualization state
│   │   ├── searchStore.ts             # Search state and history
│   │   └── uiStore.ts                 # UI state management
│   ├── types/
│   │   ├── chat.ts                    # Chat-related interfaces
│   │   ├── knowledge.ts               # Knowledge and document types
│   │   ├── graph.ts                   # Graph node and edge types
│   │   ├── search.ts                  # Search request/response types
│   │   ├── api.ts                     # API request/response types
│   │   └── common.ts                  # Shared type definitions
│   ├── utils/
│   │   ├── formatters.ts              # Data formatting utilities
│   │   ├── constants.ts               # Application constants
│   │   ├── helpers.ts                 # General helper functions
│   │   ├── graphUtils.ts              # Graph calculation utilities
│   │   ├── fileUtils.ts               # File processing utilities
│   │   └── searchUtils.ts             # Search optimization utilities
│   ├── styles/
│   │   ├── globals.css                # Global styles
│   │   ├── components.css             # Component-specific styles
│   │   ├── graph.css                  # Graph visualization styles
│   │   └── animations.css             # Animation and transition styles
│   └── assets/
│       ├── icons/                     # File type and UI icons
│       └── images/                    # Static images and logos
├── package.json
├── tailwind.config.js
├── d3.config.js                       # D3.js configuration
└── tsconfig.json
```

## Database Schema (Prisma)

### Enhanced Prisma Schema for Knowledge Management
```prisma
// prisma/schema.prisma
'''
File: schema.prisma
Purpose: Comprehensive database schema for Graphite AI Chat + Knowledge Management System
Dependencies: Prisma ORM, PostgreSQL, Vector Extensions
Tables: ChatSession, Message, Document, DocumentChunk, Knowledge Graph, Embeddings
Relationships: Complex many-to-many and hierarchical relationships
Author: Development team
'''

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Chat System Models
model ChatSession {
  id          String    @id @default(cuid())
  title       String    @default("New Chat")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  userId      String?   @map("user_id")    // For future user management
  messages    Message[]
  ragSources  RAGSource[]
  
  @@map("chat_sessions")
}

model Message {
  id           String      @id @default(cuid())
  sessionId    String      @map("session_id")
  role         MessageRole
  content      String      @db.Text
  createdAt    DateTime    @default(now())
  ragSources   RAGSource[] // Sources used for this message
  
  session      ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@map("messages")
}

// RAG and Knowledge Management Models
model Document {
  id              String          @id @default(cuid())
  filename        String
  originalName    String          @map("original_name")
  fileType        FileType        @map("file_type")
  fileSize        Int             @map("file_size")
  mimeType        String          @map("mime_type")
  storageUrl      String          @map("storage_url")      // S3/MinIO URL
  extractedText   String?         @db.Text @map("extracted_text")
  metadata        Json?           // Flexible metadata storage
  processingStatus ProcessingStatus @default(PENDING) @map("processing_status")
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  chunks          DocumentChunk[]
  embeddings      DocumentEmbedding[]
  graphNodes      KnowledgeNode[]
  ragSources      RAGSource[]
  tags            DocumentTag[]
  
  @@map("documents")
}

model DocumentChunk {
  id          String    @id @default(cuid())
  documentId  String    @map("document_id")
  content     String    @db.Text
  chunkIndex  Int       @map("chunk_index")
  startOffset Int?      @map("start_offset")
  endOffset   Int?      @map("end_offset")
  metadata    Json?     // Page numbers, section titles, etc.
  
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  embeddings  ChunkEmbedding[]
  ragSources  RAGSource[]
  
  @@unique([documentId, chunkIndex])
  @@map("document_chunks")
}

// Vector Embeddings (stored separately for performance)
model DocumentEmbedding {
  id          String    @id @default(cuid())
  documentId  String    @map("document_id")
  embedding   Bytes     // Vector embedding as binary
  model       String    // Embedding model used (e.g., "openai-ada-002")
  createdAt   DateTime  @default(now())
  
  document    Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@unique([documentId, model])
  @@map("document_embeddings")
}

model ChunkEmbedding {
  id          String        @id @default(cuid())
  chunkId     String        @map("chunk_id")
  embedding   Bytes         // Vector embedding as binary
  model       String        // Embedding model used
  createdAt   DateTime      @default(now())
  
  chunk       DocumentChunk @relation(fields: [chunkId], references: [id], onDelete: Cascade)
  
  @@unique([chunkId, model])
  @@map("chunk_embeddings")
}

// Knowledge Graph Models
model KnowledgeNode {
  id          String     @id @default(cuid())
  type        NodeType
  title       String
  content     String?    @db.Text
  documentId  String?    @map("document_id")
  metadata    Json?
  position    Json?      // Graph layout position
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  document    Document?  @relation(fields: [documentId], references: [id], onDelete: SetNull)
  outgoingEdges KnowledgeEdge[] @relation("SourceNode")
  incomingEdges KnowledgeEdge[] @relation("TargetNode")
  
  @@map("knowledge_nodes")
}

model KnowledgeEdge {
  id           String        @id @default(cuid())
  sourceId     String        @map("source_id")
  targetId     String        @map("target_id")
  relationship EdgeType
  weight       Float?        @default(1.0)
  metadata     Json?
  createdAt    DateTime      @default(now())
  
  source       KnowledgeNode @relation("SourceNode", fields: [sourceId], references: [id], onDelete: Cascade)
  target       KnowledgeNode @relation("TargetNode", fields: [targetId], references: [id], onDelete: Cascade)
  
  @@unique([sourceId, targetId, relationship])
  @@map("knowledge_edges")
}

// RAG Source Tracking
model RAGSource {
  id           String         @id @default(cuid())
  sessionId    String?        @map("session_id")
  messageId    String?        @map("message_id")
  documentId   String?        @map("document_id")
  chunkId      String?        @map("chunk_id")
  sourceType   RAGSourceType  @map("source_type")
  relevanceScore Float        @map("relevance_score")
  searchType   SearchType     @map("search_type")
  createdAt    DateTime       @default(now())
  
  session      ChatSession?   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  message      Message?       @relation(fields: [messageId], references: [id], onDelete: Cascade)
  document     Document?      @relation(fields: [documentId], references: [id], onDelete: Cascade)
  chunk        DocumentChunk? @relation(fields: [chunkId], references: [id], onDelete: Cascade)
  
  @@map("rag_sources")
}

// Tagging System
model DocumentTag {
  id          String     @id @default(cuid())
  documentId  String     @map("document_id")
  tag         String
  confidence  Float?     @default(1.0)
  source      TagSource  @default(MANUAL)
  createdAt   DateTime   @default(now())
  
  document    Document   @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@unique([documentId, tag])
  @@map("document_tags")
}

// Enums
enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum FileType {
  PDF
  IMAGE
  VIDEO
  AUDIO
  TEXT
  SPREADSHEET
  PRESENTATION
  ARCHIVE
  OTHER
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  INDEXED
}

enum NodeType {
  DOCUMENT
  CONCEPT
  ENTITY
  TOPIC
  KEYWORD
  SECTION
}

enum EdgeType {
  REFERENCES
  CONTAINS
  RELATED_TO
  SIMILAR_TO
  DEPENDS_ON
  PART_OF
  MENTIONS
  CONTRADICTS
  SUPPORTS
}

enum RAGSourceType {
  DOCUMENT
  CHUNK
  GRAPH_NODE
  EXTERNAL
}

enum SearchType {
  LEXICAL
  SEMANTIC
  HYBRID
  GRAPH_TRAVERSAL
}

enum TagSource {
  MANUAL
  EXTRACTED
  AI_GENERATED
  INFERRED
}
```

## RAG Pipeline Architecture

### Multi-Modal Search Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RAG Pipeline Flow                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  User Query → Query Analysis → Multi-Search → Ranking → Context Assembly   │
│       │              │             │            │              │           │
│       ▼              ▼             ▼            ▼              ▼           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Intent    │  │Query     │  │Lexical   │  │Relevance │  │Context   │   │
│  │Detection │  │Expansion │  │Search    │  │Scoring   │  │Generation│   │
│  │& Routing │  │& Rewrite │  │(Elastic) │  │& Fusion  │  │& Injection│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │              │             │            │              │           │
│       │              │        ┌──────────┐      │              │           │
│       │              └────────│Semantic  │──────┤              │           │
│       │                       │Search    │      │              │           │
│       │                       │(Vector)  │      │              │           │
│       │                       └──────────┘      │              │           │
│       │                            │            │              │           │
│       │                       ┌──────────┐      │              │           │
│       └───────────────────────│Graph     │──────┘              │           │
│                               │Traversal │                     │           │
│                               │(Neo4j)   │                     │           │
│                               └──────────┘                     │           │
│                                                                │           │
│                                    ┌──────────┐                │           │
│                                    │Hybrid    │────────────────┘           │
│                                    │Ranking   │                            │
│                                    │& Fusion  │                            │
│                                    └──────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Search Methods Integration

**1. Lexical Search (Elasticsearch)**
- Full-text search with TF-IDF scoring
- Keyword matching and phrase queries
- Boolean and fuzzy search capabilities
- Fast exact term matching

**2. Semantic Search (Vector Embeddings)**
- OpenAI text-embedding-3 embeddings for semantic similarity
- ChromaDB for high-performance vector search
- Cosine similarity scoring
- Intent and context understanding

**3. Symbolic Search (Knowledge Graph)**
- PostgreSQL edges traversal (MVP) with proper indexing; optional Neo4j integration for advanced traversal
- Relationship-based traversal
- Concept and entity linking
- Contextual knowledge discovery

**4. Hybrid Ranking & Fusion**
- Reciprocal Rank Fusion (RRF) algorithm
- Weighted scoring based on search type confidence
- Query complexity analysis for method selection
- Re-ranking based on user interaction patterns

### Query Enhancement Pipeline

**Query Analysis & Routing**
```python
class QueryProcessor:
    def analyze_query(self, query: str) -> QueryAnalysis:
        """
        Analyze query to determine optimal search strategy
        - Intent classification (factual, exploratory, comparative)
        - Entity extraction and recognition
        - Query complexity scoring
        - Search method routing recommendations
        """
        
    def enhance_query(self, query: str, context: List[str]) -> List[str]:
        """
        Generate enhanced query variations
        - Synonym expansion using WordNet/ConceptNet
        - Query generalization and specification
        - Multi-perspective query generation
        - Context-aware query reformulation
        """
```

**Fanout Search Strategy**
```python
class FanoutSearchService:
    async def parallel_search(self, enhanced_queries: List[str]) -> SearchResults:
        """
        Execute multiple search strategies in parallel:
        1. Lexical: Original + enhanced queries on Elasticsearch
        2. Semantic: Embedding-based search on vector store
        3. Graph: Concept traversal on knowledge graph
        4. Hybrid: Combination strategies for complex queries
        """
```

## Knowledge Graph Construction

### Automated Graph Building Pipeline

```python
class GraphBuilder:
    def extract_entities_and_concepts(self, document: Document) -> List[Entity]:
        """
        Extract entities and concepts using:
        - Named Entity Recognition (spaCy)
        - Concept extraction with LLMs
        - Topic modeling with LDA
        - Keyphrase extraction
        """
        
    def generate_relationships(self, entities: List[Entity]) -> List[Relationship]:
        """
        Generate semantic relationships:
        - Co-occurrence analysis
        - Dependency parsing for syntactic relationships
        - LLM-based relationship classification
        - Cross-document concept linking
        """
        
    def build_semantic_clusters(self, nodes: List[KnowledgeNode]) -> GraphClusters:
        """
        Create semantic clusters for visualization:
        - Community detection algorithms
        - Embedding-based clustering
        - Topic-based grouping
        - Hierarchical clustering for multi-level views
        """
```

### Graph Visualization & Interaction

**D3.js Force-Directed Graph**
```typescript
interface GraphVisualization {
  nodes: GraphNode[]      // Documents, concepts, entities
  edges: GraphEdge[]      // Semantic relationships
  clusters: Cluster[]     // Topic-based groupings
  layout: LayoutConfig    // Force simulation parameters
  
  // Interactive features
  onNodeClick: (node: GraphNode) => void
  onEdgeClick: (edge: GraphEdge) => void
  onClusterExpand: (cluster: Cluster) => void
  searchHighlight: (query: string) => void
}

class InteractiveKnowledgeGraph {
  // Real-time graph updates via WebSocket
  // Dynamic clustering based on user interactions
  // Semantic zoom levels (document → concept → entity)
  // Path finding between concepts
}
```

## Core Backend Services

### Enhanced RAG Service
```python
'''
File: app/services/rag_service.py
Purpose: Advanced RAG pipeline with multi-modal search and query enhancement
Dependencies: Elasticsearch, Vector DB, OpenAI, Prisma
Imports: SearchService, EmbeddingService, GraphService
Exports: RAGService with hybrid search and context generation
'''

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import asyncio

@dataclass
class RAGContext:
    sources: List[Dict[str, Any]]
    relevance_scores: List[float]
    search_methods_used: List[str]
    total_chunks: int
    context_length: int

class RAGService:
    def __init__(self, 
                 search_service: SearchService,
                 embedding_service: EmbeddingService,
                 graph_service: GraphService):
        self.search = search_service
        self.embeddings = embedding_service
        self.graph = graph_service
        
    async def enhanced_retrieval(self, 
                               query: str, 
                               context: List[str] = None,
                               max_chunks: int = 10) -> RAGContext:
        """
        Advanced RAG retrieval with multi-modal search
        1. Query analysis and enhancement
        2. Parallel search across all modalities
        3. Intelligent result fusion and ranking
        4. Context assembly with source tracking
        """
        
        # Query enhancement
        enhanced_queries = await self._enhance_query(query, context)
        
        # Parallel search execution
        search_tasks = [
            self._lexical_search(enhanced_queries),
            self._semantic_search(query, enhanced_queries),
            self._graph_search(query, enhanced_queries)
        ]
        
        lexical_results, semantic_results, graph_results = await asyncio.gather(*search_tasks)
        
        # Intelligent result fusion
        fused_results = self._fuse_search_results(
            lexical_results, semantic_results, graph_results
        )
        
        # Context assembly
        context = self._assemble_context(fused_results[:max_chunks])
        
        return context
        
    async def _enhance_query(self, query: str, context: List[str]) -> List[str]:
        """Query enhancement with synonym expansion and reformulation"""
        # Implementation for query enhancement pipeline
        pass
        
    async def _fuse_search_results(self, *result_sets) -> List[Dict]:
        """Reciprocal Rank Fusion algorithm implementation"""
        # Advanced result fusion logic
        pass
```

### Multi-LLM Router and Provider Adapters
```python
'''
File: app/services/llm_router.py
Purpose: Provide a single interface to multiple LLM providers with per-request selection
'''

from enum import Enum
from typing import Dict, Any

class Provider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    PERPLEXITY = "perplexity"

class LLMRouter:
    def __init__(self, adapters: Dict[Provider, Any], default_provider: Provider):
        self.adapters = adapters
        self.default_provider = default_provider

    async def chat(self, messages, provider: Provider = None, model: str = None, **kwargs):
        p = provider or self.default_provider
        adapter = self.adapters[p]
        return await adapter.chat(messages=messages, model=model, **kwargs)
```

### File Processing Service
```python
'''
File: app/services/file_service.py
Purpose: Multi-format file processing with intelligent chunking and metadata extraction
Dependencies: PyPDF2, Pillow, OpenCV, pandas, python-docx
'''

class FileProcessingService:
    def __init__(self):
        self.processors = {
            'pdf': PDFProcessor(),
            'image': ImageProcessor(),
            'video': VideoProcessor(),
            'excel': ExcelProcessor(),
            'text': TextProcessor()
        }
        
    async def process_document(self, file_path: str, document_id: str) -> ProcessingResult:
        """
        Intelligent document processing pipeline:
        1. File type detection and validation
        2. Content extraction with format-specific processors
        3. Intelligent chunking based on document structure
        4. Metadata extraction and enrichment
        5. Vector embedding generation
        6. Knowledge graph node creation
        """
        
        file_type = self._detect_file_type(file_path)
        processor = self.processors[file_type]
        
        # Extract content and structure
        extraction_result = await processor.extract_content(file_path)
        
        # Intelligent chunking
        chunks = await self._intelligent_chunking(
            extraction_result.text, 
            extraction_result.structure
        )
        
        # Generate embeddings
        embeddings = await self._generate_embeddings(chunks)
        
        # Create knowledge graph nodes
        graph_nodes = await self._create_graph_nodes(
            extraction_result, chunks
        )
        
        return ProcessingResult(
            chunks=chunks,
            embeddings=embeddings,
            graph_nodes=graph_nodes,
            metadata=extraction_result.metadata
        )
```

### Enhanced AI Agent with RAG
```python
'''
File: app/services/ai_agent.py  
Purpose: Enhanced Pydantic AI agent with integrated RAG and source citation
'''

class EnhancedAIAgent:
    def __init__(self, rag_service: RAGService):
        self.rag_service = rag_service
        self.agent = Agent(
            model=OpenAIChatModel('gpt-4'),
            instructions="""You are Graphite, an AI assistant with access to a comprehensive 
            knowledge base. Always cite your sources when using retrieved information. 
            Provide clear, accurate responses with proper attribution."""
        )
    
    async def stream_response_with_rag(self, 
                                     message: str, 
                                     session_history: List[Dict],
                                     session_id: str) -> AsyncIterator[Dict]:
        """
        Enhanced streaming with RAG integration:
        1. Retrieve relevant context from knowledge base
        2. Augment prompt with retrieved information
        3. Stream response with source citations
        4. Track RAG sources for conversation history
        """
        
        # Retrieve relevant context
        rag_context = await self.rag_service.enhanced_retrieval(
            message, 
            context=[msg['content'] for msg in session_history[-5:]]
        )
        
        # Augment prompt with RAG context
        augmented_prompt = self._build_augmented_prompt(message, rag_context)
        
        # Stream response with source tracking
        async with self.agent.run_stream(augmented_prompt) as result:
            # Yield sources first
            yield {
                'event': 'sources_loaded',
                'data': {
                    'sources': rag_context.sources,
                    'search_methods': rag_context.search_methods_used
                }
            }
            
            # Stream AI response
            async for chunk in result.stream_text():
                yield {
                    'event': 'message_delta',
                    'data': {'delta': chunk}
                }
            
            # Save RAG source references
            await self._save_rag_sources(session_id, result.run_id, rag_context)
```

## Core Frontend Components

### Enhanced Chat Interface with RAG
```typescript
'''
File: src/components/Chat/ChatInterface.tsx
Purpose: Enhanced chat interface with RAG source display and citation handling
'''

interface RAGSource {
  documentId: string
  chunkId: string
  title: string
  snippet: string
  relevanceScore: number
  searchType: 'lexical' | 'semantic' | 'hybrid'
}

const ChatInterface: React.FC = () => {
  const [sources, setSources] = useState<RAGSource[]>([])
  const [showSources, setShowSources] = useState(false)
  
  const handleStreamEvent = (event: StreamEvent) => {
    switch (event.type) {
      case 'sources_loaded':
        setSources(event.data.sources)
        setShowSources(true)
        break
        
      case 'message_delta':
        // Handle streaming text with citation markers
        break
        
      case 'message_complete':
        // Final processing and source linking
        break
    }
  }
  
  return (
    <div className="chat-interface">
      <MessageList messages={messages} onCitationClick={handleCitationClick} />
      <MessageInput onSend={handleSendMessage} />
      {showSources && (
        <SourcePanel sources={sources} onSourceClick={handleSourceClick} />
      )}
    </div>
  )
}
```

### Interactive Knowledge Graph
```typescript
'''
File: src/components/Graph/SemanticGraph.tsx
Purpose: Interactive D3.js knowledge graph with semantic clustering
'''

interface GraphNode {
  id: string
  type: 'document' | 'concept' | 'entity'
  title: string
  cluster: string
  size: number
  color: string
  position: { x: number, y: number }
}

interface GraphEdge {
  source: string
  target: string
  relationship: string
  weight: number
}

const SemanticGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const { nodes, edges, isLoading } = useKnowledgeGraph()
  
  useEffect(() => {
    if (!svgRef.current || isLoading) return
    
    const svg = d3.select(svgRef.current)
    
    // Force simulation setup
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 5))
    
    // Render graph with interactive features
    renderInteractiveGraph(svg, nodes, edges, simulation)
    
  }, [nodes, edges, isLoading])
  
  return (
    <div className="semantic-graph">
      <GraphControls onZoom={handleZoom} onFilter={handleFilter} />
      <svg ref={svgRef} className="graph-canvas" />
      <GraphLegend nodeTypes={nodeTypes} edgeTypes={edgeTypes} />
    </div>
  )
}
```

## System Integration Features

This enhanced design provides:

1. **Dual Interface Experience**: Clean chat UI + powerful knowledge management
2. **Advanced RAG Pipeline**: Multi-modal search with intelligent result fusion
3. **Interactive Knowledge Graph**: D3.js visualization with semantic clustering  
4. **Comprehensive File Support**: PDF, images, videos, Excel, text processing
5. **Smart Query Enhancement**: Query rewriting and fanout for better retrieval
6. **Real-time Collaboration**: WebSocket updates for graph changes
7. **Source Attribution**: Complete citation tracking and reference management
8. **Scalable Architecture**: Modular design supporting future enhancements
9. **Performance Optimization**: Caching, parallel processing, and efficient indexing
10. **Type Safety**: Full TypeScript integration across all components

## Implementation Roadmap

### MVP v0.1 (Confidence-Building)
- Scope: End-to-end happy path with production-like infra, minimal features.
- Chat:
  - SSE streaming via FastAPI endpoint `POST /api/chat/stream`.
  - `LLMRouter` with provider adapters; env-selected default model. Client-side model picker.
  - Persist chat sessions/messages in PostgreSQL.
- Upload + Visualization:
  - Upload to S3; store `Document` and basic metadata.
  - Extract plain text for PDF and `.txt`; create naive fixed-size `DocumentChunk` rows.
  - Render a basic force-directed graph with one node per document (no entities yet).
- Basic RAG:
  - Generate embeddings for chunks with OpenAI embeddings API.
  - Index in ChromaDB; implement top-k semantic retrieval only.
  - Augment prompt with concatenated top-k snippets; show source list in UI.
- Hybrid later: Add Elasticsearch and graph traversal in Phase 2 once MVP is stable.

### Phase 1: Foundation
- ✅ Basic chat interface with streaming
- 🔲 Enhanced Prisma schema implementation
- 🔲 File upload and basic processing pipeline
- 🔲 Vector database setup (ChromaDB)
- 🔲 Basic RAG integration

### Phase 2: Knowledge Management 
- 🔲 Multi-format file processors (PDF, images, Excel)
- 🔲 Elasticsearch integration for lexical search
- 🔲 Knowledge graph construction pipeline
- 🔲 Basic graph visualization with D3.js
- 🔲 Enhanced search with hybrid ranking

### Phase 3: Advanced Features
- 🔲 Interactive knowledge graph with clustering
- 🔲 Query enhancement and fanout search
- 🔲 Advanced RAG with source attribution
- 🔲 Real-time graph updates via WebSocket
- 🔲 Performance optimization and caching

### Phase 4: Polish & Scale 
- 🔲 Advanced graph interactions and filtering
- 🔲 Collaborative features and user management
- 🔲 Performance monitoring and analytics
- 🔲 Production deployment and scaling
- 🔲 Documentation and user guides

## Technical Dependencies

### Backend Dependencies
```python
# Core Framework
fastapi>=0.100.0
pydantic-ai>=0.0.13
prisma>=0.11.0

# AI and ML
openai>=1.0.0
anthropic>=0.34.0
google-generativeai>=0.5.4
httpx>=0.27.0
transformers>=4.30.0
sentence-transformers>=2.2.0
spacy>=3.6.0

# Search and Vector
elasticsearch>=8.0.0
chromadb>=0.5.0

# File Processing
PyPDF2>=3.0.1
Pillow>=10.0.0
python-docx>=0.8.11
pandas>=2.0.0
opencv-python>=4.8.0

# Infrastructure
redis>=4.5.0
celery>=5.3.0
boto3>=1.28.0
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "d3": "^7.8.0",
    "zustand": "^4.4.0",
    "react-dropzone": "^14.2.0",
    "react-markdown": "^8.0.0",
    "lucide-react": "^0.263.0"
  }
}
```