import Chat from '@/components/Chat';
import ConversationContextProvider from '@/components/ConversationContext';
import { ArrowSquareOut, GithubLogo } from '@phosphor-icons/react/dist/ssr';

const ABOUT_LINK =
  'https://github.com/typesense/showcase-conversational-search-pg-essays/blob/main/README.md';
const SOURCE_LINK =
  'https://github.com/typesense/showcase-conversational-search-pg-essays';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="sticky top-0 px-4 xs:px-8 py-4 flex items-center bg-gray-100 z-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <h1 className="text-xl font-bold uppercase text-gray-900">
            Conversations
          </h1>
          <div className="inline-flex gap-1.5 items-center text-sm text-gray-700">
            Powered by
            <a
              href="https://typesense.org"
              target="_blank"
              className="flex-shrink-0"
            >
              <img
                src="https://airports-geosearch.typesense.org/images/typesense.svg"
                className="h-4 sm:h-5"
              />
            </a>
          </div>
        </div>

        <div className="ml-auto hidden md:flex gap-3">
          <a
            href={ABOUT_LINK}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-200 text-sm font-medium"
          >
            About
            <ArrowSquareOut weight="bold" className="w-4 h-4" />
          </a>

          <a
            href={SOURCE_LINK}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium"
          >
            Source code
            <GithubLogo weight="bold" className="w-4 h-4" />
          </a>
        </div>

        <div className="flex md:hidden flex-col justify-center items-end gap-2 ml-auto">
          <a
            href={ABOUT_LINK}
            target="_blank"
            className="text-sm underline text-gray-900 transition-colors hover:text-[#f00373]"
          >
            About
          </a>
          <a
            href={SOURCE_LINK}
            target="_blank"
            className="text-sm underline text-gray-900 transition-colors hover:text-[#f00373]"
          >
            Source Code
          </a>
        </div>
      </div>

      <div className="flex flex-col flex-1 bg-white rounded-md shadow-md shadow-gray-200 xs:mx-8 xs:mb-4 px-4">
        <ConversationContextProvider>
          <Chat />
        </ConversationContextProvider>
      </div>
    </div>
  );
}

export const runtime = 'edge';