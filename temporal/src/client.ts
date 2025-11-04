import "dotenv/config";
// @@@SNIPSTART typescript-next-oneclick-client
import { Client, Connection } from "@temporalio/client";

const client: Client = makeClient();

function makeClient(): Client {
  const connection = Connection.lazy({
    address: process.env.TEMPORAL_ADDRESS,
    apiKey: process.env.TEMPORAL_API_KEY,
    tls: true,
  });
  return new Client({ connection });
}

export function getTemporalClient(): Client {
  return client;
}
// @@@SNIPEND
