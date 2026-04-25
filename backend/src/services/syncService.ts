import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { BookmarkNodeDTO, SyncPullResponse, SyncPushPayload } from "../types/contracts.js";

const hashPath = (path: string[]) => createHash("sha256").update(path.join("/")).digest("hex");

export class SyncService {
  constructor(private readonly fastify: FastifyInstance) {}

  async push(userId: string, payload: SyncPushPayload) {
    const now = new Date();
    const results = [] as Array<{ browserNodeId: string; appNodeId: string }>;

    for (const node of payload.nodes) {
      const pathHash = hashPath(node.path);
      const existingByMapping = await this.fastify.prisma.bookmarkMapping.findUnique({
        where: {
          deviceId_browserNodeId: {
            deviceId: payload.deviceId,
            browserNodeId: node.browserNodeId,
          },
        },
        include: { bookmark: true },
      });

      const bookmark = existingByMapping?.bookmark
        ? await this.fastify.prisma.bookmarkNode.update({
            where: { id: existingByMapping.bookmark.id },
            data: {
              title: node.title,
              url: node.url ?? null,
              position: node.position,
              type: node.type,
              pathHash,
              deletedAt: node.deletedAt ? new Date(node.deletedAt) : null,
              clientUpdatedAt: new Date(node.updatedAt),
            },
          })
        : await this.fastify.prisma.bookmarkNode.create({
            data: {
              userId,
              type: node.type,
              title: node.title,
              url: node.url ?? null,
              position: node.position,
              pathHash,
              clientUpdatedAt: new Date(node.updatedAt),
            },
          });

      if (!existingByMapping) {
        await this.fastify.prisma.bookmarkMapping.create({
          data: {
            bookmarkNodeId: bookmark.id,
            deviceId: payload.deviceId,
            browserNodeId: node.browserNodeId,
          },
        });
      }

      await this.fastify.prisma.changeEvent.create({
        data: {
          userId,
          bookmarkNodeId: bookmark.id,
          sourceDeviceId: payload.deviceId,
          changeType: node.deletedAt ? "DELETE" : existingByMapping ? "UPDATE" : "CREATE",
          payload: node,
          processedAt: now,
        },
      });

      results.push({ browserNodeId: node.browserNodeId, appNodeId: bookmark.id });
    }

    return { cursor: now.toISOString(), mapped: results };
  }

  async pull(userId: string, deviceId: string, cursor?: string): Promise<SyncPullResponse> {
    const since = cursor ? new Date(cursor) : new Date(0);
    const events = await this.fastify.prisma.changeEvent.findMany({
      where: {
        userId,
        sourceDeviceId: { not: deviceId },
        createdAt: { gt: since },
      },
      include: { bookmark: true },
      orderBy: { createdAt: "asc" },
    });

    const operations: SyncPullResponse["operations"] = events.map((event: (typeof events)[number]) => {
      if (event.changeType === "DELETE" || event.bookmark.deletedAt) {
        return { type: "DELETE", appNodeId: event.bookmark.id, reason: "remote-delete" };
      }

      const payload = event.payload as BookmarkNodeDTO;
      return {
        type: "UPSERT",
        node: {
          ...payload,
          appNodeId: event.bookmark.id,
        },
      };
    });

    return {
      cursor: new Date().toISOString(),
      operations,
    };
  }
}
