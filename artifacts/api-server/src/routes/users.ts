import { Router, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireOwner, type AuthRequest } from "../middlewares/auth";

const router = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

router.get("/users", requireAuth, requireOwner, async (_req, res: Response) => {
  const users = await db.select().from(usersTable);
  res.json(users.map(serializeUser));
});

router.patch("/users/:id/role", requireAuth, requireOwner, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { role } = req.body;

  if (!["USER", "ADMIN", "OWNER"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json(serializeUser(user));
});

export default router;
