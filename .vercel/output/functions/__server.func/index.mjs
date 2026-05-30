import { createApp } from "@tanstack/start";
import { createRequestHandler } from "@tanstack/start/server";
import * as server from "../../dist/server/_ssr/index.mjs";
import { manifest } from "../../dist/server/_tanstack-start-manifest_v-B-EsxOQ0.mjs";

const app = createApp({ manifest });
export const requestHandler = createRequestHandler({
  app,
  server: server,
});

export const vavite = {
  requestHandler,
  assets: () => import.meta.env.DEV ? () => [] : () => import.meta.glob("../../dist/client/**/*", { eager: true, import: "default" })
};