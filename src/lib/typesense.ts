import { Client } from "typesense";

const typesense = new Client({
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST ?? "localhost",
      port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT ?? 8108),
      protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL ?? "http",
    },
  ],
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_API_KEY ?? "",
  // 15 minutes
  connectionTimeoutSeconds: 15 * 60,
  logLevel: "debug",
});

export default typesense;
