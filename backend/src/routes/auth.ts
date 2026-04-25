import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await fastify.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw fastify.httpErrors.conflict("Email already exists");
    }

    // TODO: replace with bcrypt/argon2 in production.
    const user = await fastify.prisma.user.create({
      data: { email: body.email, passwordHash: `plain:${body.password}` },
    });

    const token = await reply.jwtSign({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  });

  fastify.post("/auth/login", async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const user = await fastify.prisma.user.findUnique({ where: { email: body.email } });

    if (!user || user.passwordHash !== `plain:${body.password}`) {
      throw fastify.httpErrors.unauthorized("Invalid credentials");
    }

    const token = await reply.jwtSign({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };
  });
};

export default authRoutes;
