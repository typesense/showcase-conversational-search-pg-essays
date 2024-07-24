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

async function createConversationHistoryCollection(conversationStoreCollectionName: string) {
  console.log('Creating conversation history collection')

  let conversationStoreSchema = {
    name: conversationStoreCollectionName,
    fields: [
      {
        name: "conversation_id",
        type: <const> "string",
        facet: true
      },
      {
        name: "role",
        type: <const> "string",
        index: false
      },
      {
        name: "message",
        type: <const> "string",
        index: false
      },
      {
        name: "timestamp",
        type: <const> "int32"
      }
    ]
  }
  const results = await typesense.collections().create(conversationStoreSchema);
  console.log(results);
}

async function indexInTypesense() {
  let results;

  // Create the collection that will store the data we want to ask questions on
  let dataCollectionName = 'pg-essays';
  const dataCollectionExists = await typesense.collections(dataCollectionName).exists();
  if (dataCollectionExists && process.env.FORCE_REINDEX === 'true') {
    console.log('Deleting existing data collection')
    await typesense.collections(dataCollectionName).delete();
    await createDataCollection(dataCollectionName);
  } else if (!dataCollectionExists) {
    await createDataCollection(dataCollectionName);
  }

  // Create a collection that will store conversation history for follow-up questions
  let conversationHistoryCollectionName = 'pg-essays-conversation-store'
  const conversationHistoryCollectionExists = await typesense.collections(conversationHistoryCollectionName).exists();
  if (conversationHistoryCollectionExists && process.env.FORCE_REINDEX === 'true') {
    console.log('Deleting existing conversation history collection')
    await typesense.collections(conversationHistoryCollectionName).delete();
    await createConversationHistoryCollection(conversationHistoryCollectionName);
  } else if (!conversationHistoryCollectionExists) {
    await createConversationHistoryCollection(conversationHistoryCollectionName);
  }

  // Create the LLM-powered conversation model resource
  const conversationModelName = 'gpt-4-turbo-model'
  // const conversationModelName = 'llama-3-8b-instruct'

  try {
    results = await typesense.conversations().models(conversationModelName).retrieve()
    console.log('Conversation model already exists, so deleting it')
    results = await typesense.conversations().models(conversationModelName).delete()
  } catch (e) {
    if(e instanceof Typesense.Errors.ObjectNotFound) {
      console.log("Conversation model not found, so creating it...")
    } else {
      console.error(e);
      throw e;
    }
  } finally {
    console.log('Creating conversation model')
    const modelCreateParameters = {
      id: conversationModelName,
      system_prompt:
          "You are an assistant for question-answering like Paul Graham. You can only make conversations based on the provided context. If a response cannot be formed strictly using the context, politely say you don't have knowledge about that topic. Do not answer questions that are not strictly on the topic of Paul Graham's essays.",
      history_collection: conversationHistoryCollectionName,

      /*** OpenAI gpt-4-turbo ***/
      model_name: 'openai/gpt-4-turbo',
      max_bytes: 16384,
      api_key: process.env.OPENAI_API_KEY ?? '',

      /*** Llama model hosted on Cloudflare ***/
      // model_name: 'cloudflare/@cf/meta/llama-3-8b-instruct',
      // max_bytes: 16384,
      // account_id: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
      // api_key: process.env.CLOUDFLARE_API_KEY ?? '',
    }
    // console.log(JSON.stringify(modelCreateParameters, null, 2));
    results = await typesense.conversations().models().create(modelCreateParameters);
  }
  console.log(results);
}

indexInTypesense();
