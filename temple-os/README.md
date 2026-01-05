# Temple OS

> A global personal + enterprise AI operating system built on the temple architecture

Temple OS is a sophisticated AI system designed to serve as an intelligent operating system for individuals, teams, and organizations. Built with Lovable, Supabase, ElevenLabs, and external LLMs, it provides executive-grade intelligence with a clear architectural metaphor.

## 🏛️ Architecture Overview

Temple OS is structured as a temple with distinct chambers, each serving a specific purpose:

- **Outer Court**: Entry point for all requests - handles authentication, classification, and simple queries
- **Inner Court**: Task planning and orchestration - breaks down complex requests
- **Priests**: Specialized advisors for different domains (Life, Strategy, Finance, etc.)
- **Sanctuary**: Core reasoning - synthesizes all inputs into coherent wisdom
- **Ark/Covenant**: Alignment and governance - ensures outputs align with values and policies
- **River**: Action dispatch - flows intelligence out to external systems
- **Memory & Storehouse**: Persistent context and knowledge

```
User → Outer Court → Inner Court → Priests → Sanctuary → Ark → River → Actions
                  ↓
              Memory (continuous learning)
```

## ✨ Features

### For Individuals (Personal Mode)
- Personal AI OS for life planning and decision-making
- Goal tracking and 90-day planning
- Learning curriculum design
- Career guidance and CV optimization
- Voice-enabled conversations

### For Teams (Team Mode)
- Shared team intelligence
- Collaborative planning and OKRs
- Project insights and recommendations
- Team knowledge management

### For Organizations (Org Mode)
- C-Suite strategic advisor
- Quarterly planning and prioritization
- Financial and operational insights
- Enterprise-grade governance and compliance
- Multi-tenant isolation with RLS

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI or Anthropic API key
- ElevenLabs API key (for voice)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/temple-os.git
cd temple-os
```

### 2. Set Up Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy outer-court
supabase functions deploy inner-court
# ... deploy other functions
```

### 3. Configure Environment

```bash
# Set secrets for Edge Functions
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Deploy Frontend (Lovable)

```bash
# In your Lovable project
# Add environment variables:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key

# Deploy
# Lovable auto-deploys on commit
```

### 5. Test

```bash
npm install
npm run test-deployment
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | Complete system architecture and design decisions |
| [Deployment](docs/deployment.md) | Production deployment guide |
| [Lovable Integration](docs/lovable-integration.md) | Frontend integration guide |
| [ElevenLabs Integration](docs/elevenlabs-integration.md) | Voice capabilities guide |

## 🏗️ Project Structure

```
temple-os/
├── types/                      # TypeScript type definitions
│   ├── identity.ts            # User, org, team types
│   ├── requests.ts            # Request/response types
│   ├── policies.ts            # Governance types
│   └── core.ts                # Service interfaces
├── supabase/
│   ├── migrations/            # Database schema
│   │   └── 001_initial_schema.sql
│   └── functions/             # Edge Functions
│       ├── _shared/           # Shared utilities
│       ├── outer-court/       # Entry point
│       ├── inner-court/       # Orchestration
│       ├── priests/           # Specialized advisors
│       │   ├── life/
│       │   ├── strategy/
│       │   └── ... (8 more)
│       ├── sanctuary/         # Core reasoning
│       ├── ark/               # Governance
│       ├── memory/            # Context storage
│       └── river/             # Action dispatch
├── examples/                  # Example flows
│   ├── personal-90-days.json # Personal use case
│   └── c-suite-quarterly.json # Executive use case
└── docs/                      # Documentation
    ├── architecture.md
    ├── deployment.md
    ├── lovable-integration.md
    └── elevenlabs-integration.md
```

## 🎯 Use Cases

### Personal: "Design my next 90 days"

```
User: "Help me design my next 90 days based on my goals: learning ML,
       getting fit, and launching my side project."

Temple OS:
1. Classifies as complex life planning
2. Consults Life Priest + Learning Priest
3. Creates comprehensive 90-day plan
4. Outputs weekly schedule with milestones
5. Triggers calendar events and reminders

Response: Detailed plan with time allocation, milestones, success metrics
```

### Executive: "Q3 priorities given Q2 results"

```
CEO: "Given our Q2 results (revenue $5.2M vs target $6M, churn at 4%),
      what should we prioritize in Q3?"

Temple OS:
1. Classifies as strategic planning (high priority, confidential)
2. Consults Strategy Priest + Finance Priest + Ops Priest
3. Analyzes Q2 performance gaps
4. Recommends prioritized OKRs for Q3
5. Checks Ark policies (financial data governance)
6. Triggers OKR dashboard creation

Response: Strategic analysis with recommended objectives, timeline,
          financial impact, and risks
```

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Lovable | React-based UI framework |
| **Backend** | Supabase | Postgres + Edge Functions |
| **Database** | Postgres + pgvector | Relational data + embeddings |
| **LLMs** | OpenAI GPT-4, Anthropic Claude | Intelligence layer |
| **Voice** | ElevenLabs | Speech-to-text + text-to-speech |
| **Runtime** | Deno | Edge Function runtime |

## 🔐 Security

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Row-Level Security (RLS) on all tables
- **Multi-tenancy**: Strict isolation by user/team/org
- **Governance**: Policy-based output filtering via Ark
- **Encryption**: At-rest and in-transit encryption
- **Audit**: Full request logging with `request_id`

## 📊 Modes

### Personal Mode
```typescript
{
  mode: "personal",
  access: ["own goals", "own memory", "personal projects"],
  priests_available: ["life", "learning", "creator", "career"]
}
```

### Team Mode
```typescript
{
  mode: "team",
  access: ["team goals", "shared projects", "team knowledge"],
  priests_available: ["all personal priests", "ops", "people"]
}
```

### Org Mode (C-Suite)
```typescript
{
  mode: "org",
  access: ["org strategy", "financials", "all teams", "policies"],
  priests_available: ["all priests"],
  governance: ["Ark policies enforced", "confidential data handling"]
}
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### End-to-End Test
```bash
npm run test:e2e
```

### Load Test
```bash
npm run test:load
```

## 📈 Monitoring

Temple OS includes built-in observability:

- **Service Logs**: All requests logged with context
- **Metrics**: Token usage, latency, error rates
- **Tracing**: Full request trace from Outer Court to River
- **Policies**: Ark violations tracked

Query logs:
```sql
SELECT * FROM service_logs
WHERE request_id = 'req_123'
ORDER BY timestamp;
```

Query metrics:
```sql
SELECT
  metric_name,
  AVG(metric_value) as avg_value,
  COUNT(*) as count
FROM metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY metric_name;
```

## 🚦 Roadmap

### Phase 1: MVP ✅
- [x] Core temple services (Outer Court, Inner Court, Sanctuary, Ark, River)
- [x] 2 example Priests (Life, Strategy)
- [x] Personal and Org modes
- [x] Memory and context
- [x] Voice integration ready

### Phase 2: Production
- [ ] Implement all 10 Priests
- [ ] Full River integrations (Slack, email, Jira, Notion)
- [ ] Advanced memory (long-term summarization)
- [ ] Reflection Priest (periodic insights)
- [ ] Mobile optimization

### Phase 3: Enterprise
- [ ] SSO and SAML
- [ ] Advanced governance (custom policies)
- [ ] Multi-model support (choose LLM per request)
- [ ] Analytics dashboard
- [ ] API for third-party integrations

## 💰 Cost Estimates

### Development (Free Tier)
- Supabase: Free (500MB DB)
- Lovable: Free tier
- OpenAI: ~$50/month (testing)
- ElevenLabs: ~$25/month
- **Total**: ~$75/month

### Production (1000 users)
- Supabase Pro: $25/month
- Lovable Pro: $19/month
- OpenAI: ~$1000-2000/month
- ElevenLabs: ~$300/month
- **Total**: ~$1344-2344/month

## 🤝 Contributing

We welcome contributions! Please see:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Built on [Supabase](https://supabase.com)
- UI powered by [Lovable](https://lovable.app)
- Voice by [ElevenLabs](https://elevenlabs.io)
- Intelligence from [OpenAI](https://openai.com) and [Anthropic](https://anthropic.com)

## 📞 Support

- **Documentation**: `/docs` folder
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: support@templeos.com (if applicable)

---

**Temple OS** - Your global personal + enterprise AI operating system

Built with ❤️ by the Temple OS team
