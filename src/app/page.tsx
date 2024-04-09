import Chat from '@/components/Chat';
import ConversationContextProvider from '@/components/ConversationContext';
import { ArrowSquareOut, GithubLogo } from '@phosphor-icons/react/dist/ssr';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="sticky top-0 px-8 py-4 flex items-center bg-gray-100 z-10">
        <h1 className="text-xl font-bold uppercase text-gray-900">
          Conversations
        </h1>
        <div className="inline-flex gap-1.5 items-center text-sm ml-3 text-gray-700">
          Powered by
          <a href="https://typesense.org" target="_blank">
            <img
              src="https://airports-geosearch.typesense.org/images/typesense.svg"
              className="h-4 md:h-5"
            />
          </a>
        </div>

        <div className="ml-auto flex gap-3">
          <a
            href="#"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-200 text-sm font-medium"
          >
            About
            <ArrowSquareOut weight="bold" className="w-4 h-4" />
          </a>

          <a
            href="#"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium"
          >
            Source code
            <GithubLogo weight="bold" className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex flex-col flex-1 bg-white rounded-md shadow-md shadow-gray-200 mx-8 mb-4">
        <ConversationContextProvider>
          <Chat />
        </ConversationContextProvider>
      </div>
    </div>
  );
}
