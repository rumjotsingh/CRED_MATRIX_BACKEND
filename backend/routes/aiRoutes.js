import express from "express";
import * as aiController from "../controllers/aiController.js";
import * as advancedAIController from "../controllers/advancedAIController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// Public AI routes
router.post("/chat", aiController.chat); // public chat (no auth)
router.get("/trends/skills", advancedAIController.getSkillTrends);

// Basic AI routes (all authenticated users)
router.use(protect);

router.post("/extract-skills", aiController.extractSkills);
router.post("/predict-nsqf", aiController.predictNSQFLevel);
router.post("/career-recommendations", aiController.getCareerRecommendations);
router.post("/skill-gap", aiController.analyzeSkillGap);

// Advanced AI routes (learner only)
router.get(
  "/pathway/nsqf",
  restrictTo("learner"),
  advancedAIController.getNSQFPathway,
);
router.post(
  "/pathway/recommend",
  restrictTo("learner"),
  advancedAIController.recommendNextCredentials,
);
router.post(
  "/job-match",
  restrictTo("learner"),
  advancedAIController.matchLearnerToJobs,
);

export default router;
