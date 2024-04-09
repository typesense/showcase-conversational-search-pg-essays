'use client';

import { Message, chat } from '@/lib/actions';
import { PaperPlaneRight } from '@phosphor-icons/react';
import autosize from 'autosize';
import { KeyboardEventHandler, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useConversationState } from './ConversationContext';

function Textarea() {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!ref.current) return;
    autosize(ref.current);
  }, []);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (!ref.current) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      if (!pending) {
        ref.current.form?.requestSubmit();
      }
    }
  };

  return (
    <textarea
      ref={ref}
      name="message"
      className="w-full bg-transparent rounded-xl pl-5 pr-12 text-white resize-none focus:outline-none placeholder:text-gray-500 max-h-40"
      rows={1}
      placeholder="Ask Typesense..."
      onKeyDown={handleKeyDown}
      required
    />
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="absolute bottom-3 right-3 bg-pink-600 p-2 text-white rounded-lg outline-pink-600 outline-offset-2 focus-visible:outline-2 focus-visible:outline transition disabled:opacity-70"
      disabled={pending}
    >
      {pending ? (
        <svg
          className="animate-spin h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <PaperPlaneRight weight="fill" />
      )}
    </button>
  );
}

export interface FormProps {
  onRequest: (user: Message) => void;
}

export default function Form({ onRequest }: FormProps) {
  const ref = useRef<HTMLFormElement>(null);
  const [{ id: conversationId }, setConversation] = useConversationState();

  return (
    <>
      <form
        ref={ref}
        className="relative flex py-4 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 shadow-lg"
        autoComplete="off"
        action={async (formData) => {
          const message = formData.get('message');
          if (typeof message !== 'string') return;

          const userMessage: Message = { message, sender: 'user', sources: [] };
          onRequest(userMessage);

          ref.current?.reset();
          const response = await chat(formData);
          if (!response) return;

          setConversation(response);
        }}
      >
        <input hidden name="conversation_id" value={conversationId} readOnly />
        <Textarea />
        <SubmitButton />
      </form>
    </>
  );
}
