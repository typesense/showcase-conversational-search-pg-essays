'use client';

import { Message } from '@/lib/actions';
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react';

export interface ConversationState {
  id: string;
  messages: Message[];
}

export const ConversationContext = createContext<
  [ConversationState, Dispatch<SetStateAction<ConversationState>>]
>([
  {
    id: '',
    messages: [],
  },
  () => {},
]);

export const useConversationState = () => useContext(ConversationContext);

export default function ConversationContextProvider({
  children,
}: PropsWithChildren) {
  const [conversation, setConversation] = useState<ConversationState>({
    id: '',
    messages: [],
  });

  return (
    <ConversationContext.Provider value={[conversation, setConversation]}>
      {children}
    </ConversationContext.Provider>
  );
}
