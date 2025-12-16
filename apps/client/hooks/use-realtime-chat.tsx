"use client";

import { supabaseClient } from "@/lib/supabaseClient";
import { useCallback, useEffect, useState } from "react";

interface UseRealtimeChatProps {
  roomName: string;
  username: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  user: {
    name: string;
  };
  createdAt: string;
}

const EVENT_MESSAGE_TYPE = "message";

export function useRealtimeChat({ roomName, username }: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channel, setChannel] = useState<ReturnType<
    typeof supabaseClient.channel
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const { data, error } = await supabaseClient
          .from("chat_messages")
          .select("*")
          .eq("room_name", roomName)
          .order("created_at", { ascending: true })
          .limit(100);

        if (error) {
          console.error("Error fetching messages:", error);
          return;
        }

        if (data) {
          const formattedMessages: ChatMessage[] = data.map((msg) => ({
            id: msg.id,
            content: msg.message,
            user: {
              name: msg.user_name,
            },
            createdAt: msg.created_at,
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error fetching initial messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchInitialMessages();
  }, [roomName]);

  useEffect(() => {
    const newChannel = supabaseClient.channel(roomName);

    newChannel
      .on("broadcast", { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    setChannel(newChannel);

    return () => {
      supabaseClient.removeChannel(newChannel);
    };
  }, [roomName, username]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!channel || !isConnected) return;

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        content,
        user: {
          name: username,
        },
        createdAt: new Date().toISOString(),
      };

      try {
        await supabaseClient.from("chat_messages").insert({
          id: message.id,
          room_name: roomName,
          user_name: username,
          message: content,
          created_at: message.createdAt,
        });

        setMessages((current) => [...current, message]);

        await channel.send({
          type: "broadcast",
          event: EVENT_MESSAGE_TYPE,
          payload: message,
        });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [channel, isConnected, username, roomName]
  );

  return { messages, sendMessage, isConnected, isLoadingMessages };
}
