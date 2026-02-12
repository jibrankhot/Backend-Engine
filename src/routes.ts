import { Router } from "express";
import { validateRequest } from "./core/validation/validator";
import { handleError } from "./core/errors/error.handler";
import { run } from "./core/run";

const router = Router();

/**
 * Health check endpoint.
 */
router.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        engine: "hybrid-db-engine",
        timestamp: Date.now(),
    });
});

/**
 * Universal procedure executor endpoint.
 * Flow:
 * route → run() → guard → resolver → executor
 */
router.post("/run", async (req, res) => {
    try {
        const body = validateRequest(req.body);

        // IMPORTANT: go through engine entry, not executor directly
        const result = await run(body);

        res.json(result);
    } catch (err: any) {
        const response = handleError(err);
        res.status(response.status.code).json(response);
    }
});

export default router;
