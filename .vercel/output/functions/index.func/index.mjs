// Import the Nitro server entry point
import { createApp } from "@tanstack/start";
import { createRequestHandler } from "@tanstack/start/server";
import * as server from "../../../dist/server/_ssr/index.mjs";
import { manifest } from "../../../dist/server/_tanstack-start-manifest_v-B-EsxOQ0.mjs";

const app = createApp({ manifest });
export const requestHandler = createRequestHandler({
  app,
  server: server,
});