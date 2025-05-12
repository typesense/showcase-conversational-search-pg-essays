'use server';

import typesense from "./typesense";
import {
  DocumentSchema,
  SearchResponseHit,
} from "typesense/lib/Typesense/Documents";

export interface Message {
  sender: 'user' | 'ai';
  message: string;
  isLoading?: boolean;
  sources: {
    title: string;
    excerpt: string;
    url: string;
  }[];
}

interface EssayDocument {
  title: string;
  text: string;
  url: string;
}

export async function hitsToSources(
  hits?: SearchResponseHit<DocumentSchema>[]
): Promise<Message["sources"]> {
  return (
    hits?.slice(0, 3).map((hit) => ({
      title: hit.document.title,
      excerpt: hit.document.text
        .split("\n")
        .slice(1, 10)
        .join("\n")
        .slice(0, 100),
      url: hit.document.url,
    })) ?? []
  );
}

export async function chat(formData: FormData) {
  const conversationId = formData.get('conversation_id');
  const message = formData.get('message');
  if (typeof message !== 'string') return;

  const conversationModelName = 'gpt-4-turbo-model'
  // const conversationModelName = 'llama-3-8b-instruct'

  let response = await typesense
    .collections<EssayDocument>('pg-essays')
    .documents()
    .search({
      q: message,
      query_by: 'embedding',
      exclude_fields: 'embedding',
      conversation_model_id: conversationModelName,
      conversation: true,
      conversation_id:
        typeof conversationId === 'string' ? conversationId : undefined,
    });

  // In edge runtime, response is a JSON string
  if (typeof response === "string") {
    response = JSON.parse(response);
  }

  return {
    id: response?.conversation?.conversation_id || 'Could not find conversation_id in response.',
    message: response?.conversation?.answer || 'Could not find answer in response.',
    sources: hitsToSources(response?.hits ?? []),
    response: response
  };
}
