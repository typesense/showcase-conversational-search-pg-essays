"use client";

import { Message, hitsToSources } from "@/lib/actions";
import { useConversationState } from "./ConversationContext";
import { Client } from "typesense";
import { useCallback, useMemo, useRef } from "react";
import { SearchParams } from "typesense/lib/Typesense/Types";
import type { FormProps } from "@/components/Form";
import {
  DocumentSchema,
  SearchResponse,
} from "typesense/lib/Typesense/Documents";

const INITIAL_MESSAGES = [
  "What is the Maker's Schedule?",
  "What are the characteristics of a good startup idea?",
  "What are the advantages and disadvantages of a startup being located in Silicon Valley?",
  "Perspective on the role of hacker culture in society",
];

const TYPESENSE_CONFIG = {
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST ?? "localhost",
      port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? 8108),
      protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? "http",
    },
  ],
  connectionTimeoutSeconds: 180,
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY ?? "",
};

export default function EmptyChat({ onRequest }: FormProps) {
  const [conversation, setConversation] = useConversationState();

  const messageRef = useRef("");
  const sourcesRef = useRef<Message["sources"]>([]);
  const conversationIdRef = useRef<string | undefined>(undefined);

  const typesenseClient = useMemo(() => new Client(TYPESENSE_CONFIG), []);

  const sendMessage = useCallback(
    async (message: string) => {
      const userMessage: Message = { message, sender: "user", sources: [] };
      onRequest(userMessage);

      const currentHistory = conversation.messages;
      const id = conversation.id;

      conversationIdRef.current = id;

      setConversation({
        id,
        messages: [...currentHistory, userMessage],
      });

      try {
        const searchParams: SearchParams = {
          q: message,
          query_by: "embedding",
          conversation: true,
          conversation_model_id: process.env.NEXT_PUBLIC_TYPESENSE_CONVERSATION_MODEL_ID,
          conversation_stream: true,
          exclude_fields: "embedding",
          streamConfig: {
            onChunk: (data: { conversation_id: string; message: string }) => {
              messageRef.current += data.message;
              if (data.conversation_id) {
                conversationIdRef.current = data.conversation_id;
              }

              setConversation({
                id: conversationIdRef.current || "",
                messages: [
                  ...currentHistory,
                  userMessage,
                  {
                    message: messageRef.current,
                    sender: "ai",
                    sources: sourcesRef.current,
                  },
                ],
              });
            },
            onComplete: async (data: SearchResponse<DocumentSchema>) => {
              if (data.hits && data.conversation) {
                sourcesRef.current = await hitsToSources(data.hits);
                conversationIdRef.current =
                  data.conversation.conversation_id?.toString();

                setConversation({
                  id: conversationIdRef.current || "",
                  messages: [
                    ...currentHistory,
                    userMessage,
                    {
                      message: messageRef.current,
                      sender: "ai",
                      sources: sourcesRef.current,
                    },
                  ],
                });
              }
            },
            onError: (error: Error) => {
              console.error("Error during conversation stream:", error);
            },
          },
        };

        if (id) {
          searchParams.conversation_id = id;
        }

        await typesenseClient
          .collections("pg-essays")
          .documents()
          .search(searchParams);
      } catch (error) {
        console.error("Error during conversation:", error);
      }
    },
    [conversation, onRequest, setConversation, typesenseClient]
  );

  const createMessageHandler = useCallback(
    (message: string) => () => {
      sendMessage(message);
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col flex-grow items-center justify-center">
      <h2 className="text-2xl font-semibold text-center">
        Conversational Search on PG Essays
      </h2>
      <p className="mt-4 text-gray-700 text-center max-w-lg text-balance">
        This demo showcases the AI powered conversational search capabilities of
        Typesense with{" "}
        <a
          href="https://paulgraham.com/articles.html"
          target="_blank"
          className="text-gray-900 underline underline-offset-2"
        >
          Paul Graham's essays
        </a>
        .
      </p>
      <div className="grid xs:grid-cols-2 gap-2 mt-14">
        {INITIAL_MESSAGES.map((message, index) => (
          <button
            className="rounded-lg bg-gray-100 py-3 xs:py-2 px-4 text-xs text-left text-gray-900 hover:bg-gray-200 transition-colors"
            key={index}
            onClick={createMessageHandler(message)}
          >
            {message}
          </button>
        ))}
      </div>
    </div>
  );
}
