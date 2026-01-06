# Temple Architecture - Application Planning Framework
## Copy this entire template into Miro for every new application

---

## 🏛️ TEMPLE ARCHITECTURE PLANNING FRAMEWORK

**Application Name:** _________________
**Target Users:** _________________
**Primary Purpose:** _________________
**Date:** _________________

---

## STEP 1: DEFINE YOUR TEMPLE STRUCTURE

### Core Question: What are the sacred chambers of your system?

Map your application to the temple architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    OUTER COURT (Entry)                      │
│  What touches the outside world first?                      │
│  - Authentication?                                          │
│  - Request validation?                                      │
│  - Simple operations that don't need deep processing?       │
│                                                             │
│  YOUR OUTER COURT:                                          │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    INNER COURT (Orchestration)              │
│  What coordinates complex operations?                       │
│  - Task planning?                                           │
│  - Context gathering?                                       │
│  - Delegation to specialists?                               │
│                                                             │
│  YOUR INNER COURT:                                          │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PRIESTS (Specialists)                    │
│  What specialized domains does your app serve?              │
│  List 3-10 specialized "advisors" or modules                │
│                                                             │
│  YOUR PRIESTS:                                              │
│  1. _________________ (handles: _________________)         │
│  2. _________________ (handles: _________________)         │
│  3. _________________ (handles: _________________)         │
│  4. _________________ (handles: _________________)         │
│  5. _________________ (handles: _________________)         │
│  6. _________________ (handles: _________________)         │
│  7. _________________ (handles: _________________)         │
│  8. _________________ (handles: _________________)         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SANCTUARY (Core Logic)                   │
│  Where does everything come together?                       │
│  - Final decision making?                                   │
│  - Synthesis of specialist outputs?                         │
│  - Core business logic?                                     │
│                                                             │
│  YOUR SANCTUARY:                                            │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ARK/COVENANT (Governance)                │
│  What rules must NEVER be violated?                         │
│  - Security policies?                                       │
│  - Compliance requirements?                                 │
│  - Business rules that override everything?                 │
│                                                             │
│  YOUR ARK POLICIES:                                         │
│  1. ________________________________________________       │
│  2. ________________________________________________       │
│  3. ________________________________________________       │
│  4. ________________________________________________       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    RIVER (Actions Out)                      │
│  What actions flow out to the world?                        │
│  - External API calls?                                      │
│  - Notifications?                                           │
│  - Data exports?                                            │
│                                                             │
│  YOUR RIVER ACTIONS:                                        │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    MEMORY/STOREHOUSE (Context)              │
│  What does your system remember?                            │
│  - User preferences?                                        │
│  - Historical data?                                         │
│  - Learned patterns?                                        │
│                                                             │
│  YOUR MEMORY STORES:                                        │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
│  □ _____________________________________________           │
└─────────────────────────────────────────────────────────────┘
```

---

## STEP 2: DATA FLOW MAPPING

### Map 3 Key User Journeys

**Journey 1 (Simple):** _________________________________

```
User Input → Outer Court → [Simple Processing] → Response
           ↓
       [Memory?]

Time Budget: _____ seconds
Services Used: _______________________________
```

**Journey 2 (Complex):** _________________________________

```
User Input → Outer Court → Inner Court → [Priests] → Sanctuary → Ark → River
           ↓               ↓              ↓           ↓          ↓      ↓
       [Memory]        [Context]      [Outputs]   [Synthesis] [Check] [Actions]

Time Budget: _____ seconds
Services Used: _______________________________
```

**Journey 3 (Edge Case):** _________________________________

```
User Input → [Your custom flow]

Time Budget: _____ seconds
Services Used: _______________________________
```

---

## STEP 3: TECH STACK DECISIONS

### Frontend
- [ ] Framework: _________________
- [ ] UI Library: _________________
- [ ] State Management: _________________
- [ ] Why this choice? _________________________________

### Backend/API Layer
- [ ] Platform: _________________
- [ ] Runtime: _________________
- [ ] API Type (REST/GraphQL/tRPC): _________________
- [ ] Why this choice? _________________________________

### Database
- [ ] Primary DB: _________________
- [ ] Caching Layer: _________________
- [ ] Vector/Embeddings (if AI): _________________
- [ ] Why this choice? _________________________________

### External Services
- [ ] AI/LLM Provider: _________________
- [ ] Voice (if applicable): _________________
- [ ] Email/SMS: _________________
- [ ] Other: _________________

### Hosting
- [ ] Frontend: _________________
- [ ] Backend: _________________
- [ ] Database: _________________
- [ ] Estimated Monthly Cost: $_______

---

## STEP 4: CORE DATA MODELS

### Define 5-10 Key Types/Interfaces

```typescript
// Example structure - adapt to your language

interface User {
  // Your user model
}

interface Request {
  // How requests flow through your system
}

interface Context {
  // What context does your system need?
}

interface Response {
  // What do you return to users?
}

interface [YourDomain1] {
  // Core domain model 1
}

interface [YourDomain2] {
  // Core domain model 2
}

// Add more as needed
```

**List your core entities:**
1. _________________
2. _________________
3. _________________
4. _________________
5. _________________

---

## STEP 5: SECURITY & GOVERNANCE CHECKLIST

### Authentication
- [ ] Method: _________________
- [ ] Multi-factor? (Y/N)
- [ ] Session management strategy: _________________

### Authorization
- [ ] Role-Based Access Control (RBAC)? (Y/N)
  - Roles: _________________________________
- [ ] Row-Level Security? (Y/N)
- [ ] API Key management? (Y/N)

### Data Protection
- [ ] Encryption at rest? (Y/N)
- [ ] Encryption in transit? (Y/N)
- [ ] PII handling strategy: _________________
- [ ] Data retention policy: _________________

### Compliance
- [ ] GDPR required? (Y/N)
- [ ] HIPAA required? (Y/N)
- [ ] SOC 2 required? (Y/N)
- [ ] Other: _________________

### Ark Policies (What can never be violated?)
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________
4. _________________________________________________
5. _________________________________________________

---

## STEP 6: MULTI-TENANCY STRATEGY

### Who are your tenant types?

- [ ] **Individual Users** (Personal Mode)
  - Access: _________________________________
  - Isolation: _________________________________

- [ ] **Teams** (Team Mode)
  - Access: _________________________________
  - Isolation: _________________________________

- [ ] **Organizations** (Org Mode)
  - Access: _________________________________
  - Isolation: _________________________________

### Isolation Strategy
- [ ] Database: Shared DB with RLS
- [ ] Database: Separate schemas per tenant
- [ ] Database: Separate databases per tenant
- [ ] Application: Scoped queries with tenant_id

---

## STEP 7: SCALING PLAN

### Current Scale (MVP)
- Expected users: _________
- Expected requests/day: _________
- Expected data size: _________

### 6-Month Scale
- Expected users: _________
- Expected requests/day: _________
- Expected data size: _________

### Scaling Triggers
When [metric] reaches [threshold], we will [action]:

1. When ____________ reaches ________, we will ________________
2. When ____________ reaches ________, we will ________________
3. When ____________ reaches ________, we will ________________

### Bottleneck Prevention
- [ ] Database indexes planned
- [ ] Caching strategy defined
- [ ] CDN for static assets
- [ ] Background job processing for heavy tasks
- [ ] Rate limiting strategy

---

## STEP 8: PRIEST (SPECIALIST) SPECIFICATIONS

For each Priest/Specialist module, define:

### Priest 1: _________________

**Domain:** _________________________________

**Responsibilities:**
- _________________________________________________
- _________________________________________________
- _________________________________________________

**Input Schema:**
```
{
  required_fields: [],
  optional_fields: []
}
```

**Output Schema:**
```
{
  returns: []
}
```

**Dependencies:** _________________________________

**Processing Time Target:** _____ ms

---

### Priest 2: _________________

[Repeat above structure for each priest]

---

## STEP 9: API ENDPOINT DESIGN

List your core API endpoints:

### Outer Court Endpoints
- `POST /api/v1/entry` - Main entry point
- `GET  /api/v1/health` - Health check
- _________________________________

### Inner Court Endpoints
- `POST /api/v1/orchestrate` - Complex operations
- _________________________________

### Priest Endpoints
- `POST /api/v1/priests/{priest_id}` - Specialist calls
- _________________________________

### Memory Endpoints
- `POST /api/v1/memory/store` - Store context
- `GET  /api/v1/memory/retrieve` - Retrieve context
- _________________________________

### River Endpoints
- `POST /api/v1/actions/dispatch` - Execute actions
- `GET  /api/v1/actions/{action_id}` - Action status
- _________________________________

---

## STEP 10: MONITORING & OBSERVABILITY

### Metrics to Track
- [ ] Request latency (p50, p95, p99)
- [ ] Error rates by service
- [ ] Active users
- [ ] Database query performance
- [ ] External API costs (if using AI/LLMs)
- [ ] Custom: _________________________________

### Logging Strategy
- [ ] Structured logs (JSON)
- [ ] Request ID tracing across services
- [ ] Log retention: _____ days
- [ ] Log aggregation tool: _________________

### Alerting
Alert when:
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Dashboard Views
1. **Real-time**: _________________________________
2. **Daily summary**: _________________________________
3. **Cost tracking**: _________________________________

---

## STEP 11: DEPLOYMENT CHECKLIST

### Pre-Launch
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] API endpoints documented
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Backup strategy in place

### Launch Day
- [ ] Monitoring dashboards live
- [ ] On-call rotation defined
- [ ] Rollback plan documented
- [ ] User communication plan ready

### Post-Launch
- [ ] Incident response plan
- [ ] Regular backup verification
- [ ] Performance review schedule
- [ ] User feedback loop

---

## STEP 12: COST ESTIMATION

### Monthly Costs (Estimated)

**Infrastructure:**
- Frontend hosting: $______
- Backend hosting: $______
- Database: $______
- Total Infrastructure: $______

**External Services:**
- AI/LLM APIs: $______
- Voice services: $______
- Email/SMS: $______
- Other: $______
- Total Services: $______

**Tools & Monitoring:**
- Error tracking: $______
- Analytics: $______
- Monitoring: $______
- Total Tools: $______

**TOTAL MONTHLY: $______**

**Per-User Cost Target:** $______

---

## STEP 13: TIMELINE & MILESTONES

### Phase 1: MVP (_____ weeks)
**Goal:** Core functionality working

Week 1-2:
- [ ] _________________________________
- [ ] _________________________________

Week 3-4:
- [ ] _________________________________
- [ ] _________________________________

Week 5-6:
- [ ] _________________________________
- [ ] _________________________________

### Phase 2: Beta (_____ weeks)
**Goal:** Production-ready with polish

- [ ] _________________________________
- [ ] _________________________________
- [ ] _________________________________

### Phase 3: Scale (_____ weeks)
**Goal:** Optimize and expand

- [ ] _________________________________
- [ ] _________________________________
- [ ] _________________________________

---

## STEP 14: RISK ASSESSMENT

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| _____ | H/M/L | H/M/L | __________ |
| _____ | H/M/L | H/M/L | __________ |
| _____ | H/M/L | H/M/L | __________ |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| _____ | H/M/L | H/M/L | __________ |
| _____ | H/M/L | H/M/L | __________ |
| _____ | H/M/L | H/M/L | __________ |

---

## STEP 15: SUCCESS METRICS

### Technical Success
- [ ] 99.9% uptime
- [ ] < 2s average response time
- [ ] < 0.1% error rate
- [ ] Custom: _________________________________

### User Success
- [ ] User satisfaction: _____ (target)
- [ ] Retention rate: _____ (target)
- [ ] Active users: _____ (target)
- [ ] Custom: _________________________________

### Business Success
- [ ] Revenue: $_____ (target)
- [ ] Cost per user: $_____ (target)
- [ ] Growth rate: _____% (target)
- [ ] Custom: _________________________________

---

## DECISION LOG

Record key architectural decisions here:

### Decision 1: _________________________________
**Date:** _______
**Context:** _________________________________
**Decision:** _________________________________
**Rationale:** _________________________________
**Alternatives Considered:** _________________________________

### Decision 2: _________________________________
**Date:** _______
**Context:** _________________________________
**Decision:** _________________________________
**Rationale:** _________________________________
**Alternatives Considered:** _________________________________

[Continue for major decisions...]

---

## FINAL REVIEW QUESTIONS

Before moving to implementation, answer these:

### Clarity
- [ ] Can a new team member understand the architecture in 15 minutes?
- [ ] Are all core entities and their relationships clear?
- [ ] Is the data flow obvious?

### Completeness
- [ ] Have we covered all major user journeys?
- [ ] Are security requirements fully defined?
- [ ] Is monitoring comprehensive?

### Feasibility
- [ ] Can we build the MVP in our timeline?
- [ ] Is the budget realistic?
- [ ] Do we have the right skills on the team?

### Scalability
- [ ] Can this handle 10x current scale?
- [ ] Are bottlenecks identified and mitigated?
- [ ] Is the cost structure sustainable?

### Alignment
- [ ] Does this architecture serve our core mission?
- [ ] Are the right things easy and the wrong things hard?
- [ ] Will this delight users?

---

## 🚀 READY TO BUILD?

If you've answered all sections above, you have:
✅ Clear architecture based on temple pattern
✅ Defined data models and flows
✅ Tech stack decided with rationale
✅ Security and governance planned
✅ Scaling strategy in place
✅ Monitoring and observability ready
✅ Timeline and milestones set
✅ Risks identified and mitigated

**Next Step:** Create detailed tickets/tasks from this plan and begin implementation!

---

## 📋 QUICK REFERENCE CARD

**The 7 Questions Every Request Must Answer:**

1. **Outer Court**: Is this simple or complex?
2. **Inner Court** (if complex): What specialists do we need?
3. **Priests**: What does each specialist contribute?
4. **Sanctuary**: How do we synthesize everything?
5. **Ark**: Does this violate any policies?
6. **River**: What actions should we trigger?
7. **Memory**: What should we remember for next time?

**The Temple Architecture Promise:**
- **Clarity**: Every component has a clear purpose
- **Modularity**: Easy to add new specialists
- **Governance**: Values and rules are central
- **Observability**: Full tracing from entry to action
- **Scalability**: Stateless services that can scale horizontally

---

## END OF TEMPLATE

**Remember:** This template is a guide, not a prison. Adapt it to your specific needs, but keep the core principles:
- Progressive depth (simple → complex)
- Clear separation of concerns
- Governance at the core
- Observability throughout
- User value above all

Good luck building! 🏛️
