import { Router, type Response } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/notifications", requireAuth, async (req: AuthRequest, res: Response) => {
  const notes = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(20);
  res.json(notes);
});

router.post("/notifications/read", requireAuth, async (req: AuthRequest, res: Response) => {
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, req.user!.id));
  res.json({ ok: true });
});

export default router;
