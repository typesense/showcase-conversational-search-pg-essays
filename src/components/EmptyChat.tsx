import { Message, chat } from '@/lib/actions';
import { useConversationState } from './ConversationContext';
import { FormProps } from './Form';

const INITIAL_MESSAGES = [
  "What is the Maker's Schedule?",
  'What are the characteristics of a good startup idea?',
  'What are the advantages and disadvantages of a startup being located in Silicon Valley?',
  'Perspective on the role of hacker culture in society',
];

export default function EmptyChat({ onRequest }: FormProps) {
  const [, setConversation] = useConversationState();

  const sendMessage = (message: string) => async () => {
    const userMessage: Message = { message, sender: 'user', sources: [] };
    onRequest(userMessage);

    const formData = new FormData();
    formData.set('message', message);
    const response = await chat(formData);
    if (!response) return;

    setConversation({
      id: response.id,
      messages: [
        userMessage,
        {
          message: response.message,
          sender: 'ai',
          sources: response.sources,
        },
      ],
    });
  };
  return (
    <div className="flex flex-col flex-grow items-center justify-center">
      <h2 className="text-2xl font-semibold">
        Typesense Conversational Search
      </h2>
      <p className="mt-4 text-gray-700 text-center max-w-lg">
        This demo showcases the AI powererd conversational search capabilities
        of Typesense with{' '}
        <a
          href="https://paulgraham.com/articles.html"
          target="_blank"
          className="text-gray-900 underline underline-offset-2"
        >
          Paul Graham's essays
        </a>
        .
      </p>
      <div className="grid grid-cols-2 gap-2 mt-14">
        {INITIAL_MESSAGES.map((message, i) => (
          <button
            className="rounded-lg bg-gray-100 py-2 px-4 text-xs text-left text-gray-900 hover:bg-gray-200 transition-colors"
            key={i}
            onClick={sendMessage(message)}
          >
            {message}
          </button>
        ))}
      </div>
    </div>
  );
}
