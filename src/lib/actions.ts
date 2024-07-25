'use server';

import typesense from './typesense';
import { SearchResponseHit } from 'typesense/lib/Typesense/Documents';

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

function hitsToSources(
  hits: SearchResponseHit<EssayDocument>[]
): Message['sources'] {
  return hits.slice(0, 3).map((hit) => ({
    title: hit.document.title,
    excerpt: hit.document.text
      .split('\n')
      .slice(1, 10)
      .join('\n')
      .slice(0, 100),
    url: hit.document.url,
  }));
}

export async function chat(formData: FormData) {
  const conversationId = formData.get('conversation_id');
  const message = formData.get('message');
  if (typeof message !== 'string') return;

  const conversationModelName = 'gpt-4-turbo-model'
  // const conversationModelName = 'llama-3-8b-instruct'

  const response = await typesense
    .collections<EssayDocument>('pg-essays')
    .documents()
    .search({
      q: message,
      query_by: 'embedding',
      conversation_model_id: conversationModelName,
      conversation: true,
      conversation_id:
        typeof conversationId === 'string' ? conversationId : undefined,
    });

  return {
    id: response?.conversation?.conversation_id || 'NA',
    message: response?.conversation?.answer || 'NA',
    sources: hitsToSources(response?.hits ?? []),
    response: response
  };
}
