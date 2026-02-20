import express from "express";
import * as learnerController from "../controllers/learnerController.js";
import * as portfolioController from "../controllers/portfolioController.js";
import * as achievementController from "../controllers/achievementController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { validate, schemas } from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication and learner role
router.use(protect);
router.use(restrictTo("learner"));

// Profile routes
router.get("/profile", learnerController.getProfile);
router.put(
  "/profile",
  validate(schemas.updateProfile),
  learnerController.updateProfile,
);

// Education and skills
router.post("/education", learnerController.addEducation);
router.post("/skills", learnerController.addSkill);

// Credentials
router.get("/credentials", learnerController.getCredentials);

// Career and skill gap
router.get(
  "/career-recommendations",
  learnerController.getCareerRecommendations,
);
router.post("/skill-gap", learnerController.getSkillGapAnalysis);
router.delete("/profile", learnerController.deleteAccount);

// Portfolio routes
router.post("/portfolio/create", portfolioController.createPortfolio);
router.post("/portfolio/share", portfolioController.generateShareToken);
router.get("/portfolio", portfolioController.getMyPortfolio);
router.post("/portfolio/unshare", portfolioController.unsharePortfolio);
router.delete("/portfolio", portfolioController.deletePortfolio);
router.get("/analytics/views", portfolioController.getPortfolioAnalytics);

// Achievement routes
router.post("/achievements", achievementController.addAchievement);
router.get("/achievements", achievementController.getAchievements);
router.put("/achievements/:id", achievementController.updateAchievement);
router.delete("/achievements/:id", achievementController.deleteAchievement);

export default router;
