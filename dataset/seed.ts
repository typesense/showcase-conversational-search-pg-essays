import 'dotenv/config';
import Typesense from 'typesense';
import ConversationModels from 'typesense/lib/Typesense/ConversationModels';
import data from './data.json';

const typesense = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST ?? 'localhost',
      port: Number(process.env.TYPESENSE_PORT ?? 8108),
      protocol: process.env.TYPESENSE_PROTOCOL ?? 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_ADMIN_API_KEY ?? '',
  // 15 minutes
  connectionTimeoutSeconds: 15 * 60,
  logLevel: 'debug',
});

async function seed() {
  if (await typesense.collections('pg-essays').exists()) {
    await typesense.collections('pg-essays').delete();
  }

  await typesense.collections().create({
    name: 'pg-essays',
    fields: [
      {
        name: 'title',
        type: 'string',
        facet: false,
      },
      {
        name: 'text',
        type: 'string',
        facet: false,
      },
      {
        name: 'embedding',
        type: 'float[]',
        embed: {
          from: ['title', 'text'],
          model_config: {
            model_name: 'ts/all-MiniLM-L12-v2',
          },
        },
      },
    ],
  });

  let results;
  results = await typesense.collections('pg-essays').documents().import(data);
  console.log(results);

  results = await (
    typesense.conversations().models() as ConversationModels
  ).create({
    model_name: 'openai/gpt-4-turbo',
    api_key: process.env.OPENAI_API_KEY ?? '',
    system_prompt:
      'You are an assistant for question-answering like Paul Graham. You can only make conversations based on the provided context. If a response cannot be formed strictly using the context, politely say you don’t have knowledge about that topic.',
    max_bytes: 16384,
  });
  console.log(results);
  console.log("👉 Set the `TYPESENSE_CONVERSATION_MODEL_ID` env variable to the `id` field of the conversational model above.")
}

seed();
