# ElevenLabs Voice Integration Guide

This guide explains how to integrate ElevenLabs voice capabilities with Temple OS in your Lovable frontend.

## Overview

ElevenLabs provides:
- **Speech-to-Text (STT)**: Convert user voice input to text
- **Text-to-Speech (TTS)**: Convert Temple OS responses to natural voice
- **Realtime API**: Low-latency bidirectional audio streaming

## Architecture

```
User Voice → ElevenLabs STT → Temple OS → ElevenLabs TTS → User Audio
```

## Setup

### 1. Get ElevenLabs API Key

1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Navigate to your profile → API Keys
3. Create a new API key
4. Add to `.env`:

```env
VITE_ELEVENLABS_API_KEY=your_api_key_here
```

### 2. Choose Integration Approach

ElevenLabs offers two approaches:

**Option A: Realtime API (Recommended)**
- WebSocket-based bidirectional streaming
- Lowest latency
- Best for conversational interfaces

**Option B: Standard API**
- REST-based request/response
- Simpler implementation
- Higher latency

This guide covers **Option A (Realtime API)** for optimal experience.

## Implementation

### 1. Voice Input Component

```tsx
// src/components/VoiceInput.tsx
import { useState, useRef, useEffect } from 'react'
import { sendToTempleOS } from '@/lib/temple-os'

export function VoiceInput() {
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const startVoiceSession = async () => {
    try {
      // 1. Connect to ElevenLabs WebSocket
      const ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/text-to-speech/stream`,
        {
          headers: {
            'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY
          }
        }
      )

      ws.onopen = async () => {
        console.log('ElevenLabs connected')

        // 2. Start recording user audio
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000
          }
        })

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        })

        mediaRecorderRef.current = mediaRecorder

        // 3. Send audio chunks to ElevenLabs for STT
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data)
          }
        }

        mediaRecorder.start(100) // Send chunks every 100ms
        setIsRecording(true)
      }

      // 4. Receive transcribed text from ElevenLabs
      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'transcript') {
          // User finished speaking
          const transcript = data.text
          await handleTranscript(transcript)
        } else if (data.type === 'audio') {
          // TTS audio response from Temple OS
          playAudio(data.audio)
        }
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Voice session error:', error)
    }
  }

  const handleTranscript = async (transcript: string) => {
    console.log('User said:', transcript)

    // Send to Temple OS
    setIsSpeaking(true)
    try {
      const response = await sendToTempleOS({
        text: transcript,
        channel: 'voice'
      })

      // Send response text to ElevenLabs for TTS
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'synthesize',
          text: response.user_facing_text,
          voice_id: 'EXAVITQu4vr4xnSDxMaL', // Default voice
          model_id: 'eleven_turbo_v2'
        }))
      }
    } catch (error) {
      console.error('Temple OS error:', error)
    } finally {
      setIsSpeaking(false)
    }
  }

  const playAudio = (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    audioContextRef.current.decodeAudioData(audioData, (buffer) => {
      const source = audioContextRef.current!.createBufferSource()
      source.buffer = buffer
      source.connect(audioContextRef.current!.destination)
      source.start(0)
    })
  }

  const stopVoiceSession = () => {
    mediaRecorderRef.current?.stop()
    wsRef.current?.close()
    setIsRecording(false)
  }

  return (
    <button
      onClick={isRecording ? stopVoiceSession : startVoiceSession}
      className={`voice-button ${isRecording ? 'recording' : ''}`}
      disabled={isSpeaking}
    >
      {isRecording ? '🔴 Stop' : '🎤 Speak'}
      {isSpeaking && <span className="speaking">Temple OS is responding...</span>}
    </button>
  )
}
```

### 2. Simplified Version (Standard API)

For simpler use cases without realtime streaming:

```tsx
// src/lib/voice.ts
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  // Use browser's built-in Web Speech API for STT
  return new Promise((resolve, reject) => {
    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      resolve(transcript)
    }

    recognition.onerror = reject
    recognition.start()
  })
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const response = await fetch(
    'https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error('TTS failed')
  }

  return await response.arrayBuffer()
}

// Usage
export async function handleVoiceInteraction() {
  // 1. Record and transcribe
  const transcript = await transcribeAudio(/* audio blob */)

  // 2. Send to Temple OS
  const response = await sendToTempleOS({
    text: transcript,
    channel: 'voice'
  })

  // 3. Synthesize and play response
  const audio = await synthesizeSpeech(response.user_facing_text)
  playAudio(audio)
}
```

### 3. Voice Button in Conversation View

```tsx
// src/components/ConversationView.tsx
import { VoiceInput } from './VoiceInput'

export function ConversationView() {
  // ... existing code ...

  return (
    <div className="conversation-view">
      <div className="messages">
        {/* ... messages ... */}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or speak..."
        />
        <button onClick={handleSend}>Send</button>
        <VoiceInput /> {/* Add voice button */}
      </div>
    </div>
  )
}
```

## Advanced Features

### 1. Voice Selection

Allow users to choose their preferred voice:

```tsx
const AVAILABLE_VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Warm and friendly' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Professional' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', description: 'Energetic' },
]

export function VoiceSettings() {
  const [selectedVoice, setSelectedVoice] = useState(AVAILABLE_VOICES[0].id)

  return (
    <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)}>
      {AVAILABLE_VOICES.map(voice => (
        <option key={voice.id} value={voice.id}>
          {voice.name} - {voice.description}
        </option>
      ))}
    </select>
  )
}
```

### 2. Interruption Handling

Allow users to interrupt Temple OS while it's speaking:

```tsx
export function VoiceInput() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)

  const interrupt = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop()
      setIsPlaying(false)
    }
  }

  const playAudio = (audioData: ArrayBuffer) => {
    audioContextRef.current!.decodeAudioData(audioData, (buffer) => {
      const source = audioContextRef.current!.createBufferSource()
      source.buffer = buffer
      source.connect(audioContextRef.current!.destination)

      source.onended = () => {
        setIsPlaying(false)
        audioSourceRef.current = null
      }

      audioSourceRef.current = source
      setIsPlaying(true)
      source.start(0)
    })
  }

  return (
    <>
      <button onClick={isRecording ? stopVoiceSession : startVoiceSession}>
        {isRecording ? 'Stop' : 'Speak'}
      </button>

      {isPlaying && (
        <button onClick={interrupt} className="interrupt-button">
          Stop Speaking
        </button>
      )}
    </>
  )
}
```

### 3. Visual Feedback

Show audio levels while recording:

```tsx
export function VoiceInput() {
  const [audioLevel, setAudioLevel] = useState(0)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const startVoiceSession = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Create audio analyser
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    analyserRef.current = analyser

    // Monitor audio levels
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const updateLevel = () => {
      if (!analyserRef.current) return

      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255) // Normalize to 0-1

      requestAnimationFrame(updateLevel)
    }
    updateLevel()
  }

  return (
    <div className="voice-input">
      <button onClick={startVoiceSession}>
        🎤 Speak
      </button>
      {isRecording && (
        <div className="audio-level">
          <div
            className="level-bar"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
```

## Error Handling

```typescript
export function handleVoiceError(error: any) {
  if (error.name === 'NotAllowedError') {
    alert('Microphone permission denied. Please enable it in your browser settings.')
  } else if (error.name === 'NotFoundError') {
    alert('No microphone found. Please connect a microphone.')
  } else if (error.code === 'ELEVENLABS_QUOTA_EXCEEDED') {
    alert('Voice service quota exceeded. Please try again later.')
  } else {
    console.error('Voice error:', error)
    alert('Voice feature encountered an error. Please try again.')
  }
}
```

## Best Practices

1. **Request permissions early**: Ask for microphone access during onboarding
2. **Provide visual feedback**: Show recording state, audio levels, and processing status
3. **Support text fallback**: Always allow typing as alternative
4. **Handle interruptions**: Allow users to stop playback mid-sentence
5. **Optimize for mobile**: Test on various mobile browsers
6. **Cache voice preferences**: Remember user's voice selection
7. **Monitor quota**: Track ElevenLabs API usage
8. **Privacy**: Clearly indicate when audio is being recorded

## Pricing Considerations

ElevenLabs charges based on:
- **Characters processed** for TTS
- **Audio minutes** for STT

Implement quota monitoring:

```typescript
export async function checkElevenLabsQuota(): Promise<{
  remaining: number;
  total: number;
}> {
  const response = await fetch(
    'https://api.elevenlabs.io/v1/user/subscription',
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    }
  )

  const data = await response.json()
  return {
    remaining: data.character_limit - data.character_count,
    total: data.character_limit
  }
}
```

## Next Steps

- See `lovable-integration.md` for full Lovable integration
- See `deployment.md` for production setup
- Test voice on different devices and browsers
