import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import analysesRouter from "./analyses.js";
import confluenceRouter from "./confluence.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/analyses", analysesRouter);
router.use("/confluence", confluenceRouter);

export default router;
