"use client";

import { EssayDocument, Message, hitsToSources } from "@/lib/actions";
import { PaperPlaneRight } from "@phosphor-icons/react";
import autosize from "autosize";
import {
  KeyboardEventHandler,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useFormStatus } from "react-dom";
import { ConversationContext } from "./ConversationContext";
import { Client } from "typesense";
import { SearchParams } from "typesense/lib/Typesense/Types";

function Textarea() {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!ref.current) return;
    autosize(ref.current);
  }, []);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (!ref.current) return;

    if (e.key === "Enter" && !e.shiftKey) {
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
      disabled={pending}
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
  typesenseClient: Client;
}

export default function Form({typesenseClient}: {typesenseClient: Client}) {
  const ref = useRef<HTMLFormElement>(null);
  const [conversation, setConversation] = useContext(ConversationContext);
  const [isPending, setIsPending] = useState(false);
  let id = conversation.id;

  const updateForm = async (formData: FormData) => {
    const message = formData.get("message");
    if (typeof message !== "string") return;

    setIsPending(true);
    const userMessage: Message = { message, sender: "user", sources: [] };

    setConversation(({ messages: history }) => ({
      id: conversation.id,
      messages: [...history, userMessage],
    }));

    const currentHistory = conversation.messages;

    try {
      const searchParams: SearchParams<EssayDocument> = {
        q: message,
        query_by: "embedding",
        conversation: true,
        conversation_model_id:
          process.env.NEXT_PUBLIC_TYPESENSE_CONVERSATION_MODEL_ID,
        conversation_stream: true,
        exclude_fields: "embedding",
        streamConfig: {
          onChunk: (data) => {
            currentMessage += data.message;
            if (data.conversation_id) {
              conversationId = data.conversation_id;
            }

            setConversation({
              id: conversationId,
              messages: [
                ...currentHistory,
                userMessage,
                {
                  message: currentMessage,
                  sender: "ai",
                  sources: currentSources,
                },
              ],
            });
          },
          onComplete: async (data) => {
            if (data.hits && data.conversation) {
              currentSources = await hitsToSources(data.hits);
              conversationId = data.conversation.conversation_id?.toString();

              setConversation({
                id: conversationId,
                messages: [
                  ...currentHistory,
                  userMessage,
                  {
                    message: currentMessage,
                    sender: "ai",
                    sources: currentSources,
                  },
                ],
              });
            }

            ref.current?.reset();
            setIsPending(false);
          },
          onError: (error: Error) => {
            console.error("Error during conversation stream:", error);
            setIsPending(false);
          },
        },
      };

      if (id) {
        searchParams.conversation_id = id;
      }

      let currentMessage = "";
      let currentSources: Message["sources"] = [];
      let conversationId = id;

      await typesenseClient
        .collections<EssayDocument>("pg-essays")
        .documents()
        .search(searchParams);
    } catch (error) {
      console.error("Error during conversation:", error);
      setIsPending(false);
    }
  };

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
