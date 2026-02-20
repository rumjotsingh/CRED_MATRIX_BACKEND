import express from "express";
import * as portfolioController from "../controllers/portfolioController.js";

const router = express.Router();

// Public route - no authentication required
router.get("/:token", portfolioController.viewPortfolio);

// Authenticated learner routes are handled in learnerRoutes

export default router;
