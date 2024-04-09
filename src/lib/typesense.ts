import { Client } from 'typesense';

const typesense = new Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST ?? 'localhost',
      port: Number(process.env.TYPESENSE_PORT ?? 8108),
      protocol: process.env.TYPESENSE_PROTOCOL ?? 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_SEARCH_API_KEY ?? '',
  connectionTimeoutSeconds: 120,
  numRetries: 4,
  logLevel: 'debug',
});

export default typesense;
