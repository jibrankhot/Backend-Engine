import { Router } from "express";
import { run } from "./core/run";
import { EngineRequest } from "./core/request";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        engine: "hybrid-db-engine",
    });
});

// Universal procedure executor
router.post("/run", async (req, res) => {
    try {
        const body = req.body as EngineRequest;

        const result = await run({
            project: body.project || body.meta?.project,
            procedure: body.procedure,
            params: body.params || body.payload?.params,
            form: body.form || body.payload?.form,
        });

        res.json(result);
    } catch (err: any) {
        res.status(500).json({
            StatusCode: 500,
            Message: err.message,
            DataSet: [],
        });
    }
});

export default router;
