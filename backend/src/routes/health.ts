import type { FastifyPluginAsync } from "fastify";

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", async () => ({ ok: true, service: "bookmark-sync-backend" }));
};

export default healthRoute;
