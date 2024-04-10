'use server';

import { ConversationModelSchema } from 'typesense/lib/Typesense/ConversationModel';
import typesense from './typesense';
import { SearchResponseHit } from 'typesense/lib/Typesense/Documents';

const getModel = (() => {
  let model: ConversationModelSchema;
  return async () => {
    if (model) return model;

    // TODO: Fix the return type issue here
    const models = (await typesense.conversations().models().retrieve()) as any;
    model = models[0];
    return model;
  };
})();

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
    .collections<EssayDocument>('essays')
    .documents()
    .search({
      q: message,
      query_by: 'embedding',
      conversation: true,
      conversation_model_id: (await getModel()).id,
      conversation_id:
        typeof conversationId === 'string' ? conversationId : undefined,
    });

  if (!response.conversation) {
    throw new Error(
      'conversational response not returned when conversation query was triggered'
    );
  }

  const conversationHistory =
    response.conversation.conversation_history.conversation;

  return {
    id: response.conversation.conversation_id,
    messages: conversationHistory.map<Message>((conv: any, i) => ({
      message: conv.user ? conv.user : conv.assistant,
      sender: conv.user ? 'user' : 'ai',
      sources:
        i === conversationHistory.length - 1
          ? hitsToSources(response.hits ?? [])
          : [],
    })),
  };
}
