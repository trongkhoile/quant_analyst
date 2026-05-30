import { handler as vercelHandler } from "nitro/dist/presets/vercel/runtime/vercel.web.mjs";
import { requestHandler } from "../../../dist/server/index.mjs";

export const handler = vercelHandler(requestHandler);
