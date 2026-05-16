import { Router, type Response } from "express";
import { db, categoriesTable, postsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth";

const router = Router();

function makeSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

router.get("/categories", async (_req, res: Response) => {
  const cats = await db.select().from(categoriesTable);

  const withCounts = await Promise.all(
    cats.map(async (cat) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(postsTable)
        .where(eq(postsTable.categoryId, cat.id));
      return { ...cat, postCount: count };
    })
  );

  res.json(withCounts);
});

router.post("/categories", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, description, color } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name required" });
    return;
  }
  const slug = makeSlug(name);
  const [cat] = await db
    .insert(categoriesTable)
    .values({ name, slug, description, color })
    .returning();
  res.status(201).json({ ...cat, postCount: 0 });
});

router.patch("/categories/:id", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, description, color } = req.body;

  const updates: Partial<typeof categoriesTable.$inferInsert> = {};
  if (name !== undefined) {
    updates.name = name;
    updates.slug = makeSlug(name);
  }
  if (description !== undefined) updates.description = description;
  if (color !== undefined) updates.color = color;

  const [cat] = await db
    .update(categoriesTable)
    .set(updates)
    .where(eq(categoriesTable.id, id))
    .returning();

  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(eq(postsTable.categoryId, cat.id));

  res.json({ ...cat, postCount: count });
});

router.delete("/categories/:id", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.status(204).send();
});

export default router;
