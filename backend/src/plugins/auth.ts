import fp from "fastify-plugin";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (request: { user?: unknown }) => string;
  }
}

export default fp(async (fastify) => {
  await fastify.register(import("@fastify/jwt"), { secret: JWT_SECRET });

  fastify.decorate("requireAuth", (request: { user?: unknown }) => {
    const user = request.user as { sub?: string } | undefined;
    if (!user?.sub) {
      throw fastify.httpErrors.unauthorized("Missing user context");
    }
    return user.sub;
  });
});
