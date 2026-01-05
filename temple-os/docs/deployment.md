# Temple OS Deployment Guide

This guide covers deploying Temple OS to production using Supabase, Lovable, and ElevenLabs.

## Prerequisites

- Supabase account (free tier works for development)
- Lovable account
- ElevenLabs API key
- OpenAI or Anthropic API key
- Node.js 18+ and npm

## Architecture

```
Lovable (Frontend) → Supabase (Backend + DB) → External APIs (LLMs, ElevenLabs)
```

## Part 1: Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and name (e.g., "temple-os-prod")
4. Generate strong database password
5. Select region closest to users
6. Wait for project creation (~2 minutes)

### 2. Database Migration

1. Navigate to SQL Editor in Supabase Dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the migration
4. Verify tables created under "Table Editor"

### 3. Enable Extensions

Already done in migration, but verify:

```sql
-- Check extensions
SELECT * FROM pg_extension
WHERE extname IN ('vector', 'uuid-ossp');
```

### 4. Create Vector Similarity Function

Add this helper function for semantic search:

```sql
CREATE OR REPLACE FUNCTION match_memory_items(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_user_id uuid DEFAULT NULL,
  filter_org_id uuid DEFAULT NULL,
  filter_team_id uuid DEFAULT NULL
)
RETURNS TABLE (
  memory_id uuid,
  user_id uuid,
  org_id uuid,
  team_id uuid,
  type text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memory_items.memory_id,
    memory_items.user_id,
    memory_items.org_id,
    memory_items.team_id,
    memory_items.type,
    memory_items.content,
    1 - (memory_items.embedding_vector <=> query_embedding) AS similarity
  FROM memory_items
  WHERE
    (filter_user_id IS NULL OR memory_items.user_id = filter_user_id)
    AND (filter_org_id IS NULL OR memory_items.org_id = filter_org_id)
    AND (filter_team_id IS NULL OR memory_items.team_id = filter_team_id)
    AND 1 - (memory_items.embedding_vector <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

### 5. Deploy Edge Functions

Install Supabase CLI:

```bash
npm install -g supabase
```

Login and link project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy all Edge Functions:

```bash
cd temple-os/supabase/functions

# Deploy each function
supabase functions deploy outer-court
supabase functions deploy inner-court
supabase functions deploy sanctuary
supabase functions deploy ark
supabase functions deploy memory
supabase functions deploy river

# Deploy Priests
supabase functions deploy priests/life
supabase functions deploy priests/strategy
# ... deploy other priests as needed
```

### 6. Set Environment Secrets

Configure API keys for Edge Functions:

```bash
# OpenAI
supabase secrets set OPENAI_API_KEY=sk-...

# Anthropic (optional)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Service role key (for internal function calls)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get your service role key from:
Supabase Dashboard → Project Settings → API → `service_role` key (secret)

### 7. Configure CORS

In Supabase Dashboard:
1. Go to Project Settings → API
2. Under "CORS" add your Lovable domain:
   - `https://your-app.lovable.app`
   - `http://localhost:3000` (for development)

## Part 2: Lovable Deployment

### 1. Create Lovable Project

1. Go to [lovable.app](https://lovable.app)
2. Create new project
3. Choose "Blank Template" or import existing

### 2. Add Environment Variables

In Lovable project settings, add:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key
```

Get these from:
- Supabase: Project Settings → API
- ElevenLabs: Profile → API Keys

### 3. Install Dependencies

In Lovable, add dependencies:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

### 4. Copy Integration Code

Copy the Lovable integration code from `docs/lovable-integration.md`:
- Create `src/lib/supabase.ts`
- Create `src/lib/temple-os.ts`
- Create `src/components/ConversationView.tsx`
- Create `src/components/VoiceInput.tsx` (if using voice)

### 5. Deploy to Production

Lovable auto-deploys on commit. Your app will be available at:
`https://your-app.lovable.app`

## Part 3: Domain & SSL

### 1. Custom Domain (Optional)

**For Lovable:**
1. Go to Lovable project settings → Domains
2. Add custom domain (e.g., `app.templeos.com`)
3. Add DNS records at your provider:
   ```
   CNAME app.templeos.com -> your-app.lovable.app
   ```

**For Supabase:**
Supabase includes SSL by default on `*.supabase.co`

### 2. Verify SSL

Check that both are served over HTTPS:
- `https://app.templeos.com`
- `https://your-project.supabase.co`

## Part 4: Testing

### 1. Health Check

Create a test script:

```typescript
// test-deployment.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

async function testDeployment() {
  console.log('Testing Temple OS deployment...')

  // Test 1: Database connection
  const { data: tables, error: dbError } = await supabase
    .from('users')
    .select('count')
    .limit(1)

  if (dbError) {
    console.error('❌ Database connection failed:', dbError)
  } else {
    console.log('✅ Database connected')
  }

  // Test 2: Outer Court function
  const { data: outerCourtData, error: outerCourtError } = await supabase.functions.invoke('outer-court', {
    body: {
      raw_request: {
        request_id: 'test-001',
        timestamp: new Date().toISOString(),
        channel: 'api',
        raw_input: 'Hello, test request',
        metadata: {}
      }
    }
  })

  if (outerCourtError) {
    console.error('❌ Outer Court failed:', outerCourtError)
  } else {
    console.log('✅ Outer Court working')
  }

  console.log('Deployment test complete!')
}

testDeployment()
```

Run:
```bash
npm install @supabase/supabase-js
npx tsx test-deployment.ts
```

### 2. End-to-End Test

Test a real flow:

```typescript
// test-e2e.ts
async function testE2E() {
  // 1. Sign up test user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'test-password-123'
  })

  if (authError) {
    console.error('Auth failed:', authError)
    return
  }

  console.log('✅ User created:', authData.user?.id)

  // 2. Send test request
  const response = await sendToTempleOS({
    text: 'What are my goals?',
    channel: 'web'
  })

  console.log('✅ Response received:', response.user_facing_text)
}

testE2E()
```

## Part 5: Monitoring

### 1. Supabase Monitoring

In Supabase Dashboard:
- **Database**: Monitor query performance, slow queries
- **Edge Functions**: View logs, invocations, errors
- **Auth**: Track sign-ups, sessions

### 2. Error Tracking

Integrate error tracking (optional):

```typescript
// src/lib/error-tracking.ts
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: import.meta.env.MODE
})

export function logError(error: any, context?: any) {
  console.error(error)
  Sentry.captureException(error, { extra: context })
}
```

### 3. Analytics

Track usage:

```typescript
// src/lib/analytics.ts
import { supabase } from './supabase'

export async function trackEvent(
  event_name: string,
  properties: Record<string, any>
) {
  await supabase.from('analytics_events').insert({
    event_name,
    properties,
    timestamp: new Date().toISOString()
  })
}
```

## Part 6: Production Checklist

### Security
- [ ] Change default database password
- [ ] Rotate API keys regularly
- [ ] Enable RLS on all tables
- [ ] Set up API rate limiting
- [ ] Configure CORS properly
- [ ] Enable 2FA for Supabase/Lovable accounts

### Performance
- [ ] Enable database indexes
- [ ] Configure connection pooling
- [ ] Set appropriate Edge Function timeouts
- [ ] Optimize LLM token usage
- [ ] Cache frequent queries

### Monitoring
- [ ] Set up error alerts
- [ ] Monitor LLM API costs
- [ ] Track Edge Function invocations
- [ ] Monitor database disk usage
- [ ] Set up uptime monitoring

### Documentation
- [ ] Document environment variables
- [ ] Create runbook for common issues
- [ ] Document rollback procedure
- [ ] Maintain API changelog

### Compliance
- [ ] Add privacy policy
- [ ] Add terms of service
- [ ] Configure data retention policies
- [ ] Enable audit logging
- [ ] Ensure GDPR compliance (if applicable)

## Part 7: Scaling

### When to Scale

Monitor these metrics:
- **Database CPU**: >70% sustained
- **Edge Function duration**: >10s average
- **LLM costs**: Exceeding budget
- **User complaints**: Slow responses

### Scaling Options

**Supabase:**
- Upgrade to Pro plan ($25/month)
- Enable read replicas
- Optimize database indexes
- Add caching layer (Redis)

**LLM Optimization:**
- Use smaller models for classification
- Implement response caching
- Reduce token usage
- Batch requests where possible

**Edge Functions:**
- Optimize cold starts
- Reduce external API calls
- Implement request queuing

## Part 8: Backup & Recovery

### Database Backups

Supabase auto-backs up daily on Pro plan. Manual backup:

```bash
# Export database
supabase db dump -f backup.sql

# Restore from backup
psql -h your-db-host -U postgres -d postgres -f backup.sql
```

### Disaster Recovery Plan

1. **Database corruption**:
   - Restore from latest backup
   - Replay transactions from logs

2. **Edge Function failure**:
   - Rollback to previous version
   - Check logs for root cause

3. **Complete outage**:
   - Switch to backup Supabase project
   - Update DNS to point to backup

## Part 9: Costs

### Estimated Monthly Costs

**Free Tier:**
- Supabase: Free (500MB DB, 2GB bandwidth)
- Lovable: Free tier available
- OpenAI: ~$50-200 (pay-as-you-go)
- ElevenLabs: ~$25-100 (depending on usage)
- **Total**: ~$75-300/month

**Production (100 daily users):**
- Supabase Pro: $25/month
- Lovable Pro: $19/month
- OpenAI: ~$500-1000/month
- ElevenLabs: ~$100-300/month
- **Total**: ~$644-1344/month

## Part 10: Support

### Getting Help

**Supabase:**
- Docs: [supabase.com/docs](https://supabase.com/docs)
- Discord: [discord.supabase.com](https://discord.supabase.com)

**Lovable:**
- Docs: [lovable.app/docs](https://lovable.app/docs)
- Support: support@lovable.app

**Temple OS:**
- GitHub: (your repo)
- Docs: `docs/` folder

### Common Issues

**Issue**: Edge Function timeout
- **Solution**: Increase timeout or optimize LLM calls

**Issue**: RLS policy denying access
- **Solution**: Check user's `user_id` matches policy

**Issue**: High LLM costs
- **Solution**: Implement caching, use smaller models

## Conclusion

Temple OS is now deployed! Users can access at:
- Web: `https://your-app.lovable.app`
- API: `https://your-project.supabase.co/functions/v1`

Monitor performance and iterate based on user feedback.
