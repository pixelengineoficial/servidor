import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import postsRouter from "./posts";
import commentsRouter from "./comments";
import categoriesRouter from "./categories";
import tagsRouter from "./tags";
import usersRouter from "./users";
import analyticsRouter from "./analytics";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(postsRouter);
router.use(commentsRouter);
router.use(categoriesRouter);
router.use(tagsRouter);
router.use(usersRouter);
router.use(analyticsRouter);
router.use(notificationsRouter);

export default router;
