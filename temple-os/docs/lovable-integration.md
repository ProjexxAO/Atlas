# Lovable Frontend Integration Guide

This guide explains how to integrate Temple OS backend services with your Lovable frontend application.

## Overview

Lovable serves as the frontend orchestrator for Temple OS, handling:
- User interface and interactions
- Voice integration with ElevenLabs
- API calls to Temple OS backend services
- Real-time response streaming
- State management

## Architecture

```
User <-> Lovable UI <-> Temple OS API (Supabase Edge Functions)
                  ^
                  |
            ElevenLabs (Voice)
```

## Setup

### 1. Environment Configuration

Create `.env` file in your Lovable project:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ELEVENLABS_API_KEY=your-elevenlabs-key
```

### 2. Install Dependencies

```bash
npm install @supabase/supabase-js
npm install @anthropic-ai/sdk # if using Anthropic directly
```

### 3. Initialize Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

## Core API Integration

### Main Entry Point: Outer Court

All requests start at the Outer Court:

```typescript
// src/lib/temple-os.ts
import { supabase } from './supabase'

export interface TempleOSRequest {
  text: string
  channel: 'web' | 'mobile' | 'voice' | 'api'
  attachments?: any[]
}

export interface TempleOSResponse {
  request_id: string
  user_facing_text: string
  structured_output?: any
  actions_triggered?: any[]
  metadata?: any
}

export async function sendToTempleOS(
  request: TempleOSRequest
): Promise<TempleOSResponse> {
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User not authenticated')
  }

  // Call Outer Court
  const { data, error } = await supabase.functions.invoke('outer-court', {
    body: {
      raw_request: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        channel: request.channel,
        raw_input: request.text,
        attachments: request.attachments || [],
        metadata: {
          locale: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }
      }
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  })

  if (error) throw error

  // If simple request, return immediately
  if (data.next_step === 'complete') {
    return data.final_response
  }

  // If complex request, follow through Inner Court -> Sanctuary
  return await handleComplexRequest(data.classified_request, session.access_token)
}

async function handleComplexRequest(
  classifiedRequest: any,
  token: string
): Promise<TempleOSResponse> {
  // Call Inner Court
  const { data: innerCourtResult } = await supabase.functions.invoke('inner-court', {
    body: { classified_request: classifiedRequest },
    headers: { Authorization: `Bearer ${token}` }
  })

  // Call Sanctuary for final synthesis
  const { data: sanctuaryResult } = await supabase.functions.invoke('sanctuary', {
    body: innerCourtResult.data,
    headers: { Authorization: `Bearer ${token}` }
  })

  // Optional: Call Ark for post-response check
  const { data: arkResult } = await supabase.functions.invoke('ark', {
    body: {
      final_response: sanctuaryResult.data.final_response,
      classified_request: classifiedRequest
    },
    headers: { Authorization: `Bearer ${token}` }
  })

  // Use modified response if Ark modified it
  const finalResponse = arkResult.data.modified_response || sanctuaryResult.data.final_response

  // Dispatch actions via River
  if (finalResponse.actions_triggered?.length > 0) {
    await supabase.functions.invoke('river', {
      body: {
        request_id: finalResponse.request_id,
        actions: finalResponse.actions_triggered
      },
      headers: { Authorization: `Bearer ${token}` }
    })
  }

  return finalResponse
}
```

## UI Components

### Conversation Interface

```tsx
// src/components/ConversationView.tsx
import { useState } from 'react'
import { sendToTempleOS } from '@/lib/temple-os'

export function ConversationView() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Send to Temple OS
      const response = await sendToTempleOS({
        text: input,
        channel: 'web'
      })

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.user_facing_text,
        structured_output: response.structured_output,
        actions: response.actions_triggered
      }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Sorry, something went wrong. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="conversation-view">
      <div className="messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {loading && <LoadingIndicator />}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Temple OS anything..."
        />
        <button onClick={handleSend}>Send</button>
        <VoiceButton />
      </div>
    </div>
  )
}
```

### Voice Integration

See `elevenlabs-integration.md` for voice-specific integration.

## Streaming Responses (Optional Enhancement)

For real-time streaming, implement SSE or WebSocket connection:

```typescript
export async function streamTempleOS(
  request: TempleOSRequest,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/outer-court`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw_request: /* ... */ })
    }
  )

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader!.read()
    if (done) break

    const chunk = decoder.decode(value)
    onChunk(chunk)
  }
}
```

## State Management

### User Context

Maintain user context in Lovable:

```typescript
// src/stores/userContext.ts
import { create } from 'zustand'

interface UserContext {
  userId: string | null
  mode: 'personal' | 'team' | 'org'
  activeGoals: any[]
  recentConversations: any[]
}

export const useUserContext = create<UserContext>((set) => ({
  userId: null,
  mode: 'personal',
  activeGoals: [],
  recentConversations: [],

  // Actions
  setMode: (mode) => set({ mode }),
  loadGoals: async () => {
    const { data } = await supabase.from('goals').select('*')
    set({ activeGoals: data || [] })
  }
}))
```

## Dashboard Views

### Personal Dashboard

```tsx
// src/pages/PersonalDashboard.tsx
export function PersonalDashboard() {
  const { activeGoals } = useUserContext()
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    loadRecentActivity()
  }, [])

  return (
    <div className="dashboard">
      <section className="goals">
        <h2>Your Goals</h2>
        {activeGoals.map(goal => (
          <GoalCard key={goal.goal_id} goal={goal} />
        ))}
      </section>

      <section className="conversations">
        <h2>Recent Conversations</h2>
        <ConversationList items={recentActivity} />
      </section>

      <section className="quick-actions">
        <QuickAction icon="📅" label="Plan next week" />
        <QuickAction icon="💡" label="Brainstorm ideas" />
        <QuickAction icon="📊" label="Review progress" />
      </section>
    </div>
  )
}
```

## Authentication

Temple OS uses Supabase Auth. Ensure users are authenticated:

```typescript
// src/App.tsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (!session) {
    return <LoginView />
  }

  return <MainApp />
}
```

## Error Handling

```typescript
export class TempleOSError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
  }
}

export async function handleTempleOSError(error: any) {
  if (error.code === 'OUTER_COURT_ERROR') {
    // Handle classification errors
  } else if (error.code === 'ARK_ERROR') {
    // Handle policy violations
  }

  // Log to your error tracking service
  console.error('Temple OS Error:', error)
}
```

## Best Practices

1. **Always authenticate**: Every API call requires valid session token
2. **Handle loading states**: Temple OS may take a few seconds for complex requests
3. **Show progress**: Display which service is processing (Outer Court → Inner Court → Priests → Sanctuary)
4. **Cache responses**: Store conversation history locally
5. **Graceful degradation**: Fallback UI if services are unavailable
6. **Respect policies**: Show policy warnings from Ark to users
7. **Action feedback**: Show users when actions are triggered (emails sent, tasks created, etc.)

## Next Steps

- See `elevenlabs-integration.md` for voice capabilities
- See `deployment.md` for production deployment
- See `architecture.md` for system architecture details
