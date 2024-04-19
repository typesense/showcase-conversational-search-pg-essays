'use client';

import type { Message } from '@/lib/actions';
import { UserCircle } from '@phosphor-icons/react/dist/ssr';
import { useEffect, useOptimistic } from 'react';
import Markdown from 'react-markdown';
import { useConversationState } from './ConversationContext';
import EmptyChat from './EmptyChat';
import Form from './Form';

interface MessageProps {
  sender: { name: string; avatar?: string };
  message: string;
  sources: Message['sources'];
  isLoading?: boolean;
  isMarkdown?: boolean;
}

function ChatMessage({
  sender,
  message,
  sources,
  isLoading,
  isMarkdown,
}: MessageProps) {
  const Content = isMarkdown ? (
    <Markdown className="prose text-black">{message}</Markdown>
  ) : (
    message
  );

  return (
    <div className="py-9 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
          {sender.avatar ? (
            <img className="w-full h-full text-gray-300" src={sender.avatar} />
          ) : (
            <UserCircle
              weight="fill"
              className="w-full h-full text-gray-300 scale-110"
            />
          )}
        </div>
        <span className="font-semibold">{sender.name}</span>
      </div>
      <div className="ml-8 leading-relaxed">
        {!isLoading ? (
          <>
            {Content}
            {sources.length > 0 && (
              <div className="mt-5">
                <h3 className="font-semibold text-sm">Sources</h3>
                <div className="mt-3 grid grid-cols-[repeat(3,minmax(10rem,1fr))] gap-2 overflow-x-auto">
                  {sources.map((source, i) => (
                    <a
                      href={source.url}
                      target="_blank"
                      className="w-full p-3 rounded-md bg-gray-100 text-xs hover:bg-gray-200 transition-colors overflow-hidden"
                      key={i}
                    >
                      <h4 className="font-semibold truncate">{source.title}</h4>
                      <p className="text-gray-600 mt-2 line-clamp-3">
                        {source.excerpt}...
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // Skeleton loaders
          <div className="animate-pulse flex flex-col mt-4 gap-2">
            <div className="max-w-80 w-9/12 h-2.5 xs:h-3 rounded-full bg-gray-200" />
            <div className="max-w-96 w-10/12 h-2.5 xs:h-3 rounded-full bg-gray-200" />
            <div className="max-w-[28rem] w-4/12 h-2.5 xs:h-3 rounded-full bg-gray-200" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const [{ messages }] = useConversationState();
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessages: Message[]) => [...state, ...newMessages]
  );

  useEffect(() => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  }, [optimisticMessages]);

  const addResponseLoadingPlaceholder = (userMessage: Message) => {
    addOptimisticMessage([
      userMessage,
      { sender: 'ai', message: '', isLoading: true, sources: [] },
    ]);
  };

  return (
    <main className="flex-grow w-full relative max-w-xl mx-auto flex flex-col">
      {optimisticMessages.length === 0 ? (
        <EmptyChat onRequest={addResponseLoadingPlaceholder} />
      ) : (
        <div className="flex flex-col pt-6 divide-y divide-gray-100">
          {optimisticMessages.map(
            ({ sender, message, sources, isLoading }, i) => (
              <ChatMessage
                sender={
                  sender === 'user'
                    ? { name: 'You' }
                    : {
                        name: 'Typesense',
                        avatar: 'https://github.com/typesense.png',
                      }
                }
                message={message}
                isLoading={isLoading}
                isMarkdown={sender === 'ai'}
                sources={sources}
                key={i}
              />
            )
          )}
        </div>
      )}

      <div className="mt-auto sticky inset-x-0 bottom-0 pt-12 pb-4 xs:pb-8 bg-gradient-to-b from-transparent via-[40%] via-white to-white">
        <Form onRequest={addResponseLoadingPlaceholder} />
      </div>
    </main>
  );
}
