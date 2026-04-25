import type { BookmarkNodeDTO } from "../shared/types";

const walk = (
  node: chrome.bookmarks.BookmarkTreeNode,
  path: string[],
  out: BookmarkNodeDTO[],
  parentId?: string,
) => {
  const nodeType = node.url ? "BOOKMARK" : "FOLDER";
  const currentPath = node.title ? [...path, node.title] : path;

  out.push({
    browserNodeId: node.id,
    parentBrowserNodeId: parentId,
    type: nodeType,
    title: node.title,
    url: node.url,
    position: node.index ?? 0,
    path: currentPath,
    updatedAt: new Date(node.dateGroupModified ?? node.dateAdded ?? Date.now()).toISOString(),
  });

  for (const child of node.children ?? []) {
    walk(child, currentPath, out, node.id);
  }
};

export const exportBrowserTree = async (): Promise<BookmarkNodeDTO[]> => {
  const roots = await chrome.bookmarks.getTree();
  const nodes: BookmarkNodeDTO[] = [];

  for (const root of roots) {
    walk(root, [], nodes);
  }

  return nodes.filter((n) => n.browserNodeId !== "0");
};

export const applyRemoteOperation = async (
  operation:
    | { type: "UPSERT"; node: BookmarkNodeDTO }
    | { type: "DELETE"; appNodeId: string; reason: string }
    | { type: "CONFLICT"; appNodeId?: string; reason: string },
) => {
  if (operation.type === "CONFLICT") {
    return;
  }

  if (operation.type === "UPSERT") {
    const { node } = operation;
    const existing = await chrome.bookmarks.search({ title: node.title, url: node.url ?? undefined });
    if (existing.length > 0) {
      return;
    }

    await chrome.bookmarks.create({
      parentId: node.parentBrowserNodeId ?? "1",
      title: node.title,
      url: node.type === "BOOKMARK" ? node.url ?? undefined : undefined,
      index: node.position,
    });
    return;
  }

  // MVP safety behavior: do not hard-delete automatically.
  console.warn("Remote delete pending manual review", operation.appNodeId, operation.reason);
};
