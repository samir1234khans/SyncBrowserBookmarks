import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { SyncService } from "../services/syncService.js";

const deviceSchema = z.object({
  browser: z.enum(["CHROME", "EDGE"]),
  deviceName: z.string().min(2),
});

const pushSchema = z.object({
  deviceId: z.string(),
  browser: z.enum(["CHROME", "EDGE"]),
  cursor: z.string().optional(),
  nodes: z.array(
    z.object({
      appNodeId: z.string().optional(),
      browserNodeId: z.string(),
      parentBrowserNodeId: z.string().nullable().optional(),
      type: z.enum(["BOOKMARK", "FOLDER"]),
      title: z.string(),
      url: z.string().nullable().optional(),
      position: z.number(),
      path: z.array(z.string()),
      updatedAt: z.string(),
      deletedAt: z.string().nullable().optional(),
    }),
  ),
});

const pullSchema = z.object({
  deviceId: z.string(),
  cursor: z.string().optional(),
});

const syncRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new SyncService(fastify);

  fastify.post("/devices/register", async (request, reply) => {
    await request.jwtVerify();
    const userId = fastify.requireAuth(request);
    const body = deviceSchema.parse(request.body);

    const device = await fastify.prisma.device.create({
      data: { userId, browser: body.browser, deviceName: body.deviceName },
    });

    return reply.code(201).send({ deviceId: device.id });
  });

  fastify.post("/sync/push", async (request) => {
    await request.jwtVerify();
    const userId = fastify.requireAuth(request);
    const payload = pushSchema.parse(request.body);

    return service.push(userId, payload);
  });

  fastify.post("/sync/pull", async (request) => {
    await request.jwtVerify();
    const userId = fastify.requireAuth(request);
    const { deviceId, cursor } = pullSchema.parse(request.body);

    return service.pull(userId, deviceId, cursor);
  });
};

export default syncRoutes;
