# Temple OS Architecture

## Overview

Temple OS is a global personal + enterprise AI operating system designed with a temple architecture metaphor. This document explains the complete system architecture, data flow, and design decisions.

## Core Philosophy

The temple architecture represents:
- **Sacred Space**: Careful, deliberate processing of user requests
- **Specialized Chambers**: Different functions handled by different services
- **Progressive Depth**: Requests move from outer to inner chambers
- **Alignment**: The Ark ensures outputs align with values and policies
- **Action**: The River flows outward to affect the world

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       USER / CLIENT                      │
│                    (Lovable Frontend)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    OUTER COURT                           │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐           │
│  │  Auth    │  │Classify  │  │Simple QA   │           │
│  │  Safety  │  │Intent    │  │(if simple) │           │
│  └──────────┘  └──────────┘  └────────────┘           │
└────────────────────┬────────────────────────────────────┘
                     │ (if complex)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    INNER COURT                           │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐           │
│  │ Planning │  │ Context  │  │ Priestly   │           │
│  │          │  │ Building │  │Orchestrate │           │
│  └──────────┘  └──────────┘  └────────────┘           │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   PRIESTS    │          │   PRIESTS    │
│   (Life,     │   ...    │  (Strategy,  │
│   Learning)  │          │   Finance)   │
└──────┬───────┘          └───────┬──────┘
       │                          │
       └────────────┬─────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│                    SANCTUARY                             │
│         Core Reasoning & Synthesis                       │
│                                                          │
│  Combines all Priest outputs into final response        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  ARK / COVENANT                          │
│               Alignment & Governance                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Pre-check │  │Post-check│  │ Policies │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                       RIVER                              │
│                  Action Dispatch                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Email   │  │  Slack   │  │  Jira    │  ...        │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

## Service Breakdown

### Outer Court

**Responsibilities:**
- Authentication and identity resolution
- Request classification (domain, intent, priority)
- Safety filtering (harmful content detection)
- Simple QA for trivial queries

**Key Decisions:**
- Uses LLM for classification (not rule-based) for flexibility
- Returns immediately for simple queries to reduce latency
- Routes complex queries to Inner Court

**Endpoints:**
- `POST /api/v1/outer-court`

### Inner Court

**Responsibilities:**
- Task planning (decompose complex requests)
- Context building (retrieve relevant memory, goals, org data)
- Priestly orchestration (delegate to specialized Priests)
- Results aggregation from Priests

**Key Decisions:**
- LLM-based task planner for dynamic decomposition
- Parallel Priest invocation where possible
- Rich context bundle with user, team, org, and memory data

**Endpoints:**
- `POST /api/v1/inner-court`

### Priestly Services

Each Priest is a specialized advisor for a domain:

| Priest | Domain | Examples |
|--------|--------|----------|
| **Life** | Personal goals, routines, habits | "Plan my week", "Create morning routine" |
| **Learning** | Education, explanations | "Explain quantum computing", "Design ML course" |
| **Creator** | Content creation, storytelling | "Write blog post", "Create presentation" |
| **Career** | Job search, CV, positioning | "Update my CV", "Prepare for interview" |
| **Strategy** | Business strategy, OKRs | "Q3 priorities", "Competitive analysis" |
| **Finance** | Financial planning, analysis | "Budget for expansion", "ROI calculation" |
| **Ops** | Process optimization | "Improve onboarding", "Reduce cycle time" |
| **Tech** | Technical architecture | "Choose database", "API design" |
| **People** | Org structure, HR | "Design team structure", "Hiring plan" |
| **Research** | External intelligence | "Market research", "Trend analysis" |

**Key Decisions:**
- Each Priest is a separate Edge Function for modularity
- Priests use domain-specific system prompts
- Priests return structured JSON for easy synthesis

**Endpoints:**
- `POST /api/v1/priests/{priest_id}`

### Sanctuary

**Responsibilities:**
- Synthesize all Priest outputs
- Generate final coherent response
- Decide on action triggers
- Maintain Temple OS's voice and persona

**Key Decisions:**
- Uses most capable LLM (GPT-4 or Claude Opus)
- Has self-awareness about temple architecture
- Can explain which services handled what
- Outputs user-facing text (markdown) + structured data

**Endpoints:**
- `POST /api/v1/sanctuary/llm`

### Ark / Covenant

**Responsibilities:**
- Pre-request filtering (block harmful requests)
- Post-response filtering (redact sensitive info)
- Policy enforcement (org-specific rules)
- Compliance and safety

**Key Decisions:**
- Policies stored in database (not hardcoded)
- Org-specific policies override global policies
- Can block, modify, warn, or log
- Critical for enterprise deployment

**Endpoints:**
- `POST /api/v1/ark/pre-request-check`
- `POST /api/v1/ark/post-response-check`

### River

**Responsibilities:**
- Action dispatch to external systems
- Integration adapters (email, Slack, Jira, etc.)
- Action status tracking
- Retry logic and error handling

**Key Decisions:**
- Pluggable adapter architecture
- All actions logged in database
- Graceful degradation if external system unavailable

**Endpoints:**
- `POST /api/v1/river/dispatch`

### Memory & Storehouse

**Responsibilities:**
- Store conversation history
- Store user preferences and goals
- Semantic search via embeddings
- Context retrieval for Priests

**Key Decisions:**
- Uses vector embeddings (OpenAI ada-002)
- Multi-tenant isolation (user/team/org scoped)
- Memory types: fact, preference, decision, plan, summary, insight

**Endpoints:**
- `POST /api/v1/memory/store-event`
- `POST /api/v1/memory/retrieve-context`
- `POST /api/v1/memory/update-user-profile`

## Data Flow

### Simple Request Flow

```
1. User: "What's on my calendar today?"
2. Outer Court:
   - Classifies as simple QA
   - Retrieves calendar from memory
   - Generates answer via LLM
   - Returns immediately
3. User receives response (~2-3 seconds)
```

### Complex Request Flow

```
1. User: "Design my next 90 days based on my goals"
2. Outer Court:
   - Classifies as complex planning
   - Routes to Inner Court
3. Inner Court:
   - Creates task plan (3 subtasks)
   - Builds context (goals, preferences, history)
   - Calls Life Priest, Learning Priest, Career Priest
4. Priests (parallel):
   - Each returns domain-specific recommendations
5. Sanctuary:
   - Synthesizes all Priest outputs
   - Generates comprehensive 90-day plan
   - Triggers actions (create calendar events)
6. Ark:
   - Checks policies (none triggered)
   - Approves response
7. River:
   - Dispatches actions to calendar system
8. User receives response (~10-15 seconds)
```

## Multi-Tenancy

Temple OS supports three modes:

### Personal Mode
- Single user
- Access to personal goals, tasks, memory
- No org/team context

### Team Mode
- Shared team context
- Access to team projects, knowledge
- Team members can see shared items
- RLS enforced via `team_id`

### Org Mode
- Full organizational context
- C-Suite insights and strategy
- Org-wide policies enforced
- RLS enforced via `org_id`

**Implementation:**
- Row-Level Security (RLS) on all tables
- Every query filtered by `user_id`, `team_id`, or `org_id`
- User identity resolved in Outer Court

## Technology Stack

### Frontend
- **Lovable**: React-based UI framework
- **Supabase Client**: Auth and API calls

### Backend
- **Supabase**: Postgres + Edge Functions
- **Deno**: Runtime for Edge Functions
- **Postgres**: Relational data + RLS
- **pgvector**: Vector similarity search

### LLMs
- **OpenAI GPT-4**: Classification, planning, synthesis
- **Anthropic Claude**: Alternative/primary for synthesis
- **OpenAI ada-002**: Embeddings

### Voice
- **ElevenLabs**: STT + TTS

### External Integrations
- Email (SendGrid, AWS SES)
- Slack
- Jira, Notion, etc. (via River adapters)

## Scaling Considerations

### Current Architecture
- **Stateless Edge Functions**: Horizontal scaling via Supabase
- **Database**: Postgres with connection pooling
- **LLM Calls**: Parallel where possible

### Future Enhancements
- **Caching**: Redis for frequently accessed context
- **Queue**: BullMQ for long-running tasks
- **CDN**: Static assets and responses
- **Rate Limiting**: Per user/org limits

## Security

### Authentication
- Supabase Auth (JWT tokens)
- Social login + email/password

### Authorization
- Row-Level Security (RLS) on all tables
- Policy-based access control via Ark

### Data Protection
- Encryption at rest (Supabase)
- Encryption in transit (HTTPS)
- PII masking before sending to LLMs (optional)

### Audit Logging
- All requests logged with `request_id`
- Service logs for debugging
- Metrics for observability

## Design Decisions

### Why Temple Architecture?
- **Clarity**: Each service has clear boundaries
- **Modularity**: Easy to add new Priests or services
- **Metaphor**: Communicates system design to non-technical users
- **Alignment**: Ark ensures values are central, not peripheral

### Why Edge Functions?
- **Supabase native**: Close to database, low latency
- **Deno runtime**: TypeScript, secure, modern
- **Serverless**: No infrastructure management

### Why Multiple LLM Calls?
- **Specialization**: Each service optimized for its task
- **Flexibility**: Can use different models for different tasks
- **Robustness**: Failure in one step doesn't cascade

### Why Not Train a Model?
- **Cost**: Training foundational models is expensive
- **Speed**: API-based approach faster to market
- **Flexibility**: Can swap LLM providers easily
- **Focus**: Architecture is the innovation, not the model

## Monitoring & Observability

### Logs
- Service logs in `service_logs` table
- Request-scoped logging with `request_id`

### Metrics
- Token usage per request
- Latency per service
- Error rates
- Policy violations

### Tracing
- Full trace from Outer Court → River
- `reasoning_trace` in responses

## Future Roadmap

### Phase 1 (MVP)
- ✅ Core temple services
- ✅ Personal + org modes
- ✅ 2 example Priests (Life, Strategy)

### Phase 2 (Production)
- [ ] All 10 Priests implemented
- [ ] Full River integrations (Slack, email, etc.)
- [ ] Advanced memory (long-term context)
- [ ] Voice optimization

### Phase 3 (Scale)
- [ ] Multi-model support (Anthropic, Gemini, etc.)
- [ ] Reflection Priest (periodic summaries)
- [ ] Mobile app
- [ ] Enterprise features (SSO, SAML)

## Conclusion

Temple OS is designed for:
- **Individuals**: Personal AI OS for life and work
- **Teams**: Shared intelligence and collaboration
- **Organizations**: Executive-grade strategic AI

The architecture is modular, secure, and ready for global deployment.
