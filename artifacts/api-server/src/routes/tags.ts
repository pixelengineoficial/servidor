import { Router, type Response } from "express";
import { db, postTagsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/tags", async (_req, res: Response) => {
  const tags = await db
    .select({
      name: postTagsTable.tag,
      postCount: sql<number>`count(*)::int`,
    })
    .from(postTagsTable)
    .groupBy(postTagsTable.tag)
    .orderBy(sql`count(*) desc`);

  res.json(tags);
});

export default router;
