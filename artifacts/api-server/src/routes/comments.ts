import { Router, type Response } from "express";
import { db, commentsTable, usersTable, postsTable, notificationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth";
import type { Server as SocketServer } from "socket.io";

const router = Router();

let io: SocketServer | null = null;
export function setIo(ioInstance: SocketServer) {
  io = ioInstance;
}

async function buildComment(comment: typeof commentsTable.$inferSelect) {
  const [author] = await db
    .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, avatarUrl: usersTable.avatarUrl, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.id, comment.authorId))
    .limit(1);
  return { ...comment, author: author ?? null };
}

router.get("/posts/:id/comments", optionalAuth, async (req: AuthRequest, res: Response) => {
  const postId = parseInt(req.params.id);
  const raw = await db.select().from(commentsTable).where(eq(commentsTable.postId, postId)).orderBy(desc(commentsTable.createdAt));
  const comments = await Promise.all(raw.map(buildComment));
  res.json(comments);
});

router.post("/posts/:id/comments", requireAuth, async (req: AuthRequest, res: Response) => {
  const postId = parseInt(req.params.id);
  const { content } = req.body;
  if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
  if (content.length > 1000) { res.status(400).json({ error: "Comment too long" }); return; }

  const [comment] = await db.insert(commentsTable).values({ content: content.trim(), postId, authorId: req.user!.id }).returning();

  // Increment comment count on post
  await db.update(postsTable).set({ commentCount: sql`${postsTable.commentCount} + 1` }).where(eq(postsTable.id, postId));

  const built = await buildComment(comment);

  if (io) {
    io.emit("new_comment", { postId, comment: built });
  }

  res.status(201).json(built);
});

router.delete("/comments/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, id)).limit(1);
  if (!comment) { res.status(404).json({ error: "Comment not found" }); return; }

  const user = req.user!;
  if (user.role !== "ADMIN" && user.role !== "OWNER" && user.id !== comment.authorId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, id));
  await db.update(postsTable).set({ commentCount: sql`GREATEST(${postsTable.commentCount} - 1, 0)` }).where(eq(postsTable.id, comment.postId));
  res.status(204).send();
});

export default router;
