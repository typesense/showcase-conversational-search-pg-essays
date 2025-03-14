'use client';

import { Message, chat, hitsToSources } from '@/lib/actions';
import { PaperPlaneRight } from '@phosphor-icons/react';
import autosize from 'autosize';
import { KeyboardEventHandler, useContext, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { ConversationContext, useConversationState } from './ConversationContext';

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
  const [conversation, setConversation] = useContext(ConversationContext);
  let id = conversation.id;

  useEffect(() => {
    conversation;
  }, [conversation]);

  const updateForm =  async (formData: any) => {
    const message = formData.get('message');
    if (typeof message !== 'string') return;

    const userMessage: Message = { message, sender: 'user', sources: [] };
    //onRequest(userMessage);

    //ref.current?.reset();
    let response = "";
    let params: string[][] = [
      ['q', message],
      ['query_by', 'embedding'],
      ['conversation', 'true'],
      ['conversation_model_id', process.env.NEXT_PUBLIC_TYPESENSE_CONVERSATION_MODEL_ID ?? ''],
      ['conversation_stream', 'true'],
      ['exclude_fields', 'embedding']
    ]
    if (id) {
      params.push(['conversation_id', id])
    }
    // if (conversationId) {
    //   params.push(['conversation_id', conversationId])
    // }
    let search_params = new URLSearchParams(params).toString()
    let url = new URL("http://localhost:8109/collections/pg-essays/documents/search")
    url.search = search_params
    const apiResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'x-typesense-api-key': process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY ?? ''
      }
    })

    let reader = await apiResponse.body?.getReader();
    let decoder = new TextDecoder();

    let isStreaming = true;
    let buffer = '';
    let currentMessage = '';
    setConversation(({ messages: history }) => ({
      id: conversation.id,
      messages: [
        ...history,
        userMessage,
      ],
    }));
    let currentHistory = conversation.messages;
    console.log("currentHistory", currentHistory)
    while (true) {
      const { done, value } = await reader?.read();
      if (done) {
        isStreaming = false;
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        response = line;
        if(line === "data: [DONE]") {
          isStreaming = false;
          continue;
        }
        try {
          let json_response = JSON.parse(response.slice(6))
          let hits:any = [];
          let conversation_id = "";
          if(!isStreaming) {
            // then this is search results
            hits = await hitsToSources(json_response.hits ?? []);
            conversation_id = json_response.conversation.conversation_id?.toString();
          } else {
            conversation_id = json_response.conversation_id?.toString();
            let answer = json_response.message;
            currentMessage += answer;
          }
          setConversation(({ messages: history }) => ({
            id: conversation_id,
            messages: [
              ...currentHistory,
              userMessage,
              {
                message: currentMessage,
                sender: 'ai',
                sources: hits
              },
            ],
          }));
          ref.current?.reset();
          //console.log("conversation: ", getConversation())
        } catch (e) {
          console.log(response)
        }

      }
    }
    // const response = await chat(formData);
    // if (!response) return;

    // setConversation(({ messages: history }) => ({
    //   id: response.id,
    //   messages: [
    //     ...history,
    //     userMessage,
    //     {
    //       message: response.message,
    //       sender: 'ai',
    //       sources: response.sources,
    //     },
    //   ],
    // }));
  }

  return (
    <>
      <form
        ref={ref}
        className="relative flex py-4 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 shadow-lg"
        autoComplete="off"
        action={updateForm}
      >
        <input hidden name="conversation_id" value={id} readOnly />
        <Textarea />
        <SubmitButton />
      </form>
    </>
  );
}
