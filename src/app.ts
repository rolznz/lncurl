import "dotenv/config";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyBody from "@fastify/formbody";
import fastifyCors from "@fastify/cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { walletRoutes } from "./routes/wallet.js";
import { feedRoutes } from "./routes/feed.js";
import { statsRoutes } from "./routes/stats.js";
import { graveyardRoutes } from "./routes/graveyard.js";
import { startChargeLoop } from "./charge-loop.js";
import { initNodeStats } from "./node-stats.js";
import { startFundBalanceLoop } from "./nwc-balances.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({ logger: true });

fastify.register(fastifyBody);
fastify.register(fastifyCors, { origin: "*" });

// Serve llms.txt
fastify.get("/llms.txt", async (_request, reply) => {
  const llmsPath = path.join(__dirname, "llms.txt");
  if (fs.existsSync(llmsPath)) {
    reply.type("text/plain").send(fs.readFileSync(llmsPath, "utf-8"));
  } else {
    reply.status(404).send("llms.txt not found");
  }
});

// Register API routes
fastify.register(walletRoutes);
fastify.register(feedRoutes);
fastify.register(statsRoutes);
fastify.register(graveyardRoutes);

// Serve frontend static files
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  fastify.register(fastifyStatic, {
    root: frontendDist,
    prefix: "/",
    wildcard: false,
  });

  // SPA fallback — serve index.html for non-API, non-file routes
  fastify.setNotFoundHandler(async (request, reply) => {
    if (
      request.url.startsWith("/api/") ||
      request.url === "/llms.txt"
    ) {
      reply.status(404).send({ error: "Not found" });
      return;
    }
    reply.type("text/html").send(
      fs.readFileSync(path.join(frontendDist, "index.html"), "utf-8"),
    );
  });
} else {
  // Development fallback — serve the old index.html
  const devIndex = path.join(__dirname, "index.html");
  if (fs.existsSync(devIndex)) {
    fastify.register(fastifyStatic, {
      root: __dirname,
      prefix: "/",
      wildcard: false,
    });
  }
}

const start = async () => {
  try {
    initNodeStats();
    startFundBalanceLoop();
    await startChargeLoop();

    await fastify.listen({
      port: parseInt(process.env.PORT || "3000"),
      host: "0.0.0.0",
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
