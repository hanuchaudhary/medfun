'use client'

import { supabaseClient } from '@/lib/supabaseClient'
import { useCallback, useEffect, useState } from 'react'

interface UseRealtimeChatProps {
  roomName: string
  username: string
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
}

const EVENT_MESSAGE_TYPE = 'message'

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabaseClient.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newChannel = supabaseClient.channel(roomName)

    newChannel
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else {
          setIsConnected(false)
        }
      })

    setChannel(newChannel)

    return () => {
      supabaseClient.removeChannel(newChannel)
    }
  }, [roomName, username, supabaseClient])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) return

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: {
          name: username,
        },
        createdAt: new Date().toISOString(),
      }

      setMessages((current) => [...current, message])

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })
    },
    [channel, isConnected, username]
  )

  return { messages, sendMessage, isConnected }
}
