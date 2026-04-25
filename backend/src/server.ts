import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import healthRoute from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import syncRoutes from "./routes/sync.js";

const buildServer = () => {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: true });
  app.register(sensible);
  app.register(prismaPlugin);
  app.register(authPlugin);

  app.register(healthRoute, { prefix: "/api" });
  app.register(authRoutes, { prefix: "/api" });
  app.register(syncRoutes, { prefix: "/api" });

  return app;
};

const start = async () => {
  const app = buildServer();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: "0.0.0.0" });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
