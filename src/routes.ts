/**
 * This file defines API routes and connects HTTP requests to the engine.
 * /health = service status
 * /run = universal procedure execution endpoint
 */

import { Router } from "express";
import { runProcedure } from "./core/executor/hybrid.executor";
import { validateRequest } from "./core/validation/validator";
import { handleError } from "./core/errors/error.handler";

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
 */
router.post("/run", async (req, res) => {
    try {
        const body = validateRequest(req.body);

        const result = await runProcedure(body);

        res.json(result);
    } catch (err: any) {
        res.status(500).json(handleError(err));
    }
});

export default router;
