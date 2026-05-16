import { Router, type Response } from "express";
import { db, postsTable, usersTable, commentsTable } from "@workspace/db";
import { gte, sql, desc } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth, type AuthRequest } from "../middlewares/auth";
import type { Server as SocketServer } from "socket.io";

const router = Router();

let io: SocketServer | null = null;
let onlineCount = 0;

export function setIo(ioInstance: SocketServer) {
  io = ioInstance;
}

export function setOnlineCount(count: number) {
  onlineCount = count;
}

router.get("/analytics/overview", requireAuth, requireAdmin, async (_req, res: Response) => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [{ totalPosts }] = await db.select({ totalPosts: sql<number>`count(*)::int` }).from(postsTable);
  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable);
  const [{ totalComments }] = await db.select({ totalComments: sql<number>`count(*)::int` }).from(commentsTable);
  const [{ totalViews }] = await db.select({ totalViews: sql<number>`coalesce(sum(view_count), 0)::int` }).from(postsTable);
  const [{ totalLikes }] = await db.select({ totalLikes: sql<number>`coalesce(sum(like_count), 0)::int` }).from(postsTable);
  const [{ postsThisWeek }] = await db.select({ postsThisWeek: sql<number>`count(*)::int` }).from(postsTable).where(gte(postsTable.createdAt, oneWeekAgo));
  const [{ commentsThisWeek }] = await db.select({ commentsThisWeek: sql<number>`count(*)::int` }).from(commentsTable).where(gte(commentsTable.createdAt, oneWeekAgo));

  const topRaw = await db.select().from(postsTable).orderBy(desc(postsTable.viewCount)).limit(5);

  res.json({
    totalPosts,
    totalUsers,
    totalComments,
    totalViews,
    totalLikes,
    postsThisWeek,
    commentsThisWeek,
    topPosts: topRaw,
  });
});

router.get("/analytics/online", optionalAuth, async (_req, res: Response) => {
  res.json({ count: onlineCount });
});

export default router;
