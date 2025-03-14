import 'dotenv/config';
import Typesense from 'typesense';

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
  // logLevel: 'debug',
});

async function createDataCollection(dataCollectionName: string) {
  console.log('Creating data collection')
  const data = require('./data.json');

  try {
    await typesense.collections('conversation_store').delete();
  } catch (e) {
  }

  await typesense.collections().create({
    name: 'conversation_store',
    fields: [
      {
          name: "conversation_id",
          type: "string"
      },
      {
          name: "model_id",
          type: "string"
      },
      {
          name: "timestamp",
          type: "int32"
      },
      {
          name: "role",
          type: "string",
          "index": false
      },
      {
          name: "message",
          type: "string",
          index: false
      }
    ]
  });
  
  await typesense.collections().create({
    name: dataCollectionName,
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
            model_name: 'ts/snowflake-arctic-embed-m',
          },
        },
      },
    ],
  });

  let results = await typesense.collections('pg-essays').documents().import(data);
  console.log(results);
}

  results = await (
    typesense.conversations().models() as ConversationModels
  ).create({
    model_name: 'openai/gpt-4-turbo',
    api_key: process.env.OPENAI_API_KEY ?? '',
    history_collection: 'conversation_store',
    system_prompt:
      'You are an assistant for question-answering like Paul Graham. You can only make conversations based on the provided context. If a response cannot be formed strictly using the context, politely say you don’t have knowledge about that topic.',
    max_bytes: 65536,
  });
  console.log(results);
}

indexInTypesense();
