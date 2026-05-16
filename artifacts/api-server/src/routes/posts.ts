import { Router, type Response } from "express";
import { db, postsTable, usersTable, categoriesTable, postTagsTable, postLikesTable, notificationsTable } from "@workspace/db";
import { eq, desc, sql, and, ilike, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin, optionalAuth, type AuthRequest } from "../middlewares/auth";
import type { Server as SocketServer } from "socket.io";

const router = Router();

export function setIo(ioInstance: SocketServer) {
  io = ioInstance;
}

let io: SocketServer | null = null;

function makeSlug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36)
  );
}

async function buildPost(post: typeof postsTable.$inferSelect, userId?: number) {
  const [author] = await db
    .select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, role: usersTable.role, avatarUrl: usersTable.avatarUrl, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.id, post.authorId))
    .limit(1);

  let category = null;
  if (post.categoryId) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, post.categoryId)).limit(1);
    if (cat) {
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(postsTable).where(eq(postsTable.categoryId, cat.id));
      category = { ...cat, postCount: count };
    }
  }

  const tags = await db.select({ tag: postTagsTable.tag }).from(postTagsTable).where(eq(postTagsTable.postId, post.id));

  let likedByMe = false;
  if (userId) {
    const [like] = await db.select().from(postLikesTable).where(and(eq(postLikesTable.postId, post.id), eq(postLikesTable.userId, userId))).limit(1);
    likedByMe = !!like;
  }

  return {
    ...post,
    author: author ?? null,
    category,
    tags: tags.map(t => t.tag),
    likedByMe,
  };
}

router.get("/posts", optionalAuth, async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  const tag = req.query.tag as string | undefined;
  const search = req.query.search as string | undefined;

  let postIds: number[] | undefined;
  if (tag) {
    const tagRows = await db.select({ postId: postTagsTable.postId }).from(postTagsTable).where(eq(postTagsTable.tag, tag));
    postIds = tagRows.map(r => r.postId);
    if (postIds.length === 0) {
      res.json({ posts: [], total: 0, page, limit });
      return;
    }
  }

  const conditions = [];
  if (categoryId) conditions.push(eq(postsTable.categoryId, categoryId));
  if (postIds) conditions.push(inArray(postsTable.id, postIds));
  if (search) conditions.push(ilike(postsTable.title, `%${search}%`));

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const rawPosts = await db
    .select()
    .from(postsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const posts = await Promise.all(rawPosts.map(p => buildPost(p, req.user?.id)));

  res.json({ posts, total, page, limit });
});

router.get("/posts/pinned", optionalAuth, async (req: AuthRequest, res: Response) => {
  const rawPosts = await db.select().from(postsTable).where(eq(postsTable.isPinned, true)).orderBy(desc(postsTable.createdAt)).limit(5);
  const posts = await Promise.all(rawPosts.map(p => buildPost(p, req.user?.id)));
  res.json(posts);
});

router.get("/posts/featured", optionalAuth, async (req: AuthRequest, res: Response) => {
  const rawPosts = await db.select().from(postsTable).where(eq(postsTable.isFeatured, true)).orderBy(desc(postsTable.createdAt)).limit(6);
  const posts = await Promise.all(rawPosts.map(p => buildPost(p, req.user?.id)));
  res.json(posts);
});

router.get("/posts/recent", optionalAuth, async (req: AuthRequest, res: Response) => {
  const rawPosts = await db.select().from(postsTable).orderBy(desc(postsTable.createdAt)).limit(5);
  const posts = await Promise.all(rawPosts.map(p => buildPost(p, req.user?.id)));
  res.json(posts);
});

router.get("/posts/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    // Try by slug
    const slugVal = req.params.id;
    const [post] = await db.select().from(postsTable).where(eq(postsTable.slug, slugVal)).limit(1);
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json(await buildPost(post, req.user?.id));
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  res.json(await buildPost(post, req.user?.id));
});

router.post("/posts", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { title, content, excerpt, coverImageUrl, categoryId, tags, isPinned, isFeatured } = req.body;
  if (!title || !content) { res.status(400).json({ error: "Title and content required" }); return; }

  const slug = makeSlug(title);

  const [post] = await db.insert(postsTable).values({
    title,
    slug,
    content,
    excerpt,
    coverImageUrl,
    authorId: req.user!.id,
    categoryId: categoryId || null,
    isPinned: !!isPinned,
    isFeatured: !!isFeatured,
  }).returning();

  if (tags && Array.isArray(tags) && tags.length > 0) {
    await db.insert(postTagsTable).values(tags.map((tag: string) => ({ postId: post.id, tag })));
  }

  const built = await buildPost(post, req.user?.id);

  // Broadcast to all connected clients
  if (io) {
    io.emit("new_post", built);
  }

  res.status(201).json(built);
});

router.patch("/posts/:id", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { title, content, excerpt, coverImageUrl, categoryId, tags, isPinned, isFeatured } = req.body;

  const updates: Partial<typeof postsTable.$inferInsert> = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (excerpt !== undefined) updates.excerpt = excerpt;
  if (coverImageUrl !== undefined) updates.coverImageUrl = coverImageUrl;
  if (categoryId !== undefined) updates.categoryId = categoryId || null;
  if (isPinned !== undefined) updates.isPinned = !!isPinned;
  if (isFeatured !== undefined) updates.isFeatured = !!isFeatured;

  const [post] = await db.update(postsTable).set(updates).where(eq(postsTable.id, id)).returning();
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }

  if (tags !== undefined) {
    await db.delete(postTagsTable).where(eq(postTagsTable.postId, id));
    if (Array.isArray(tags) && tags.length > 0) {
      await db.insert(postTagsTable).values(tags.map((tag: string) => ({ postId: id, tag })));
    }
  }

  const built = await buildPost(post, req.user?.id);
  res.json(built);
});

router.delete("/posts/:id", requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(postsTable).where(eq(postsTable.id, id));
  res.status(204).send();
});

router.post("/posts/:id/like", requireAuth, async (req: AuthRequest, res: Response) => {
  const postId = parseInt(req.params.id);
  const userId = req.user!.id;

  const [existing] = await db.select().from(postLikesTable).where(and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, userId))).limit(1);

  let liked: boolean;
  if (existing) {
    await db.delete(postLikesTable).where(eq(postLikesTable.id, existing.id));
    await db.update(postsTable).set({ likeCount: sql`${postsTable.likeCount} - 1` }).where(eq(postsTable.id, postId));
    liked = false;
  } else {
    await db.insert(postLikesTable).values({ postId, userId });
    await db.update(postsTable).set({ likeCount: sql`${postsTable.likeCount} + 1` }).where(eq(postsTable.id, postId));
    liked = true;
  }

  const [post] = await db.select({ likeCount: postsTable.likeCount }).from(postsTable).where(eq(postsTable.id, postId)).limit(1);
  res.json({ liked, likeCount: post?.likeCount ?? 0 });
});

router.post("/posts/:id/view", async (req, res: Response) => {
  const postId = parseInt(req.params.id);
  await db.update(postsTable).set({ viewCount: sql`${postsTable.viewCount} + 1` }).where(eq(postsTable.id, postId));
  res.json({ ok: true });
});

export default router;
