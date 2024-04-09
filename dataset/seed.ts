import 'dotenv/config';
import typesense from '@/lib/typesense';
import ConversationModels from 'typesense/lib/Typesense/ConversationModels';
import data from './data.json';

async function seed() {
  if (await typesense.collections('essays').exists()) {
    await typesense.collections('essays').delete();
  }

  await typesense.collections().create({
    name: 'essays',
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
  results = await typesense.collections('essays').documents().import(data);
  console.log(results);

  results = await (
    typesense.conversations().models() as ConversationModels
  ).create({
    model_name: 'openai/gpt-3.5-turbo',
    api_key: process.env.OPENAI_API_KEY ?? '',
    system_prompt:
      'You are an assistant for question-answering like Paul Graham. Answer questions according to the given context.',
    max_bytes: 16384,
  });

  console.log(results);
}

seed();
