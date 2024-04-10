# Conversational search with Typesense + Next.js App router

This demo showcases Typesense's conversational search features in a Next.js (App router) project.

## Pre-requisistes

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
5. Set the values of required environment variables in the `.env` file that was created.
6. Run the following command to create the dataset by fetching Paul Graham's essays:
   ```bash
   npm run data:fetch
   ```
7. Seed the Typesense database by running the following command.
   ```bash
   npm run data:seed
   ```
   This command may take a while depending on the size of the data.
8. Once the Typesense database has been seeded, Next.js application can be started.
   - **For production**:
     ```bash
     npm run build
     npm start
     ```
   - **For development**:
     ```bash
     npm run dev
     ```
9. Access the application at `localhost:3000`.

## Learn More

- [Typesense](https://typesense.org) - learn about Typesense.
- [Next.js](https://nextjs.org/docs) - learn about Next.js.

## License

TODO – Add license for demo project.

The dataset used is [Paul Graham's essays](https://paulgraham.com/articles.html).
