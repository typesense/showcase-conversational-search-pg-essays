# Conversational search with Typesense + Next.js App router

This demo showcases Typesense's [conversational search](https://typesense.org/docs/26.0/api/conversational-search-rag.html#conversational-search-rag) features.

The dataset contains [essays](https://paulgraham.com/articles.html) authored by [Paul Graham](https://twitter.com/paulg), indexed in Typesense. 

Questions are sent directly Typesense, which has a built-in RAG pipeline to return a conversation response, using the indexed dataset as context.  

## Pre-requisites

1. [Node.js 20.x](https://nodejs.org) and npm
2. [Typesense server](https://typesense.org/docs/guide/install-typesense.html). Can be hosted locally using the `docker-compose.yml` file in the repository, instructions in [Local Setup](#local-setup) section.

## Local Setup

1. Clone the project.

2. Install dependencies at the root of the project using npm.
   ```bash
   npm install
   ```
3. (Optional) To run a local instance of Typesense server using the `docker-compose.yml` config in this repository, run the following command.
   ```bash
   docker compose up -d
   ```
   Note: This requires [Docker](https://www.docker.com/get-started/) to be installed on the system.
4. Copy `.env.example` file and create a `.env` file at the root of the project.
5. Set the values of required environment variables in the `.env` file that was created. (Skip the `TYPESENSE_CONVERSATION_MODEL_ID` env variable for now, we'll come back to it).
6. Run the following command to create the dataset by fetching Paul Graham's essays:
   ```bash
   npm run fetchData
   ```
7. Import the data into Typesense by running the following command.
   ```bash
   npm run indexInTypesense
   ```
   This command may take a while depending on the size of the data.
8. The script will output a conversational model ID, which you want to set as the `TYPESENSE_CONVERSATION_MODEL_ID` in your `.env` file. 
9. Now start the Next.js application.
   - **For production**:
     ```bash
     npm run build
     npm start
     ```
   - **For development**:
     ```bash
     npm run dev
     ```
10. Access the application at `localhost:3000`.

## Learn More

- [Typesense](https://typesense.org)
- [Conversational Search in Typesense](https://typesense.org/docs/latest/api/conversational-search-rag.html)

## License

This project is licensed under [Apache License 2.0](https://github.com/typesense/showcase-conversational-search-pg-essays/blob/master/LICENSE).
The dataset used is [Paul Graham's essays](https://paulgraham.com/articles.html) by Paul Graham.
