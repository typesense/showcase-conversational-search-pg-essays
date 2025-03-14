import { Message, chat, hitsToSources } from '@/lib/actions';
import { useConversationState } from './ConversationContext';
import { FormProps } from './Form';

const INITIAL_MESSAGES = [
  "What is the Maker's Schedule?",
  'What are the characteristics of a good startup idea?',
  'What are the advantages and disadvantages of a startup being located in Silicon Valley?',
  'Perspective on the role of hacker culture in society',
];

export default function EmptyChat({ onRequest }: FormProps) {
  const [conversation, setConversation] = useConversationState();

  const sendMessage = (message: string) => async () => {
    const userMessage: Message = { message, sender: 'user', sources: [] };
    onRequest(userMessage);

    const formData = new FormData();
    formData.set('message', message);
    // const response = await chat(formData);
    // if (!response) return;

    // setConversation({
    //   id: response.id,
    //   messages: [
    //     userMessage,
    //     {
    //       message: response.message,
    //       sender: 'ai',
    //       sources: response.sources,
    //     },
    //   ],
    // });
    console.log("Sending message to Typesense")
    console.log(process.env);
    let response = "";
    let params: string[][] = [
      ['q', message],
      ['query_by', 'embedding'],
      ['conversation', 'true'],
      ['conversation_model_id', process.env.NEXT_PUBLIC_TYPESENSE_CONVERSATION_MODEL_ID ?? ''],
      ['conversation_stream', 'true'],
      ['exclude_fields', 'embedding']
    ]
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
  };
  return (
    <div className="flex flex-col flex-grow items-center justify-center">
      <h2 className="text-2xl font-semibold text-center">
        Conversational Search on PG Essays
      </h2>
      <p className="mt-4 text-gray-700 text-center max-w-lg text-balance">
        This demo showcases the AI powered conversational search capabilities of
        Typesense with{' '}
        <a
          href="https://paulgraham.com/articles.html"
          target="_blank"
          className="text-gray-900 underline underline-offset-2"
        >
          Paul Graham's essays
        </a>
        .
      </p>
      <div className="grid xs:grid-cols-2 gap-2 mt-14">
        {INITIAL_MESSAGES.map((message, i) => (
          <button
            className="rounded-lg bg-gray-100 py-3 xs:py-2 px-4 text-xs text-left text-gray-900 hover:bg-gray-200 transition-colors"
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
