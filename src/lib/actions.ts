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

  const response = await typesense
    .collections<EssayDocument>('pg-essays')
    .documents()
    .search({
      q: message,
      query_by: 'embedding',
      conversation_model_id: 'gpt-4-turbo-model',
      // conversation_model_id: 'llama-2-model',
      conversation: true,
      conversation_id:
        typeof conversationId === 'string' ? conversationId : undefined,
    });

  if (!response.conversation) {
    throw new Error(
      'conversational response not returned when conversation query was triggered'
    );
  }
  return {
    id: response.conversation.conversation_id,
    message: response.conversation.answer,
    sources: hitsToSources(response.hits ?? []),
  };
}
