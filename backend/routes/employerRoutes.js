import express from "express";
import * as employerController from "../controllers/employerController.js";
import * as jobController from "../controllers/jobController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(restrictTo("employer"));

// Profile routes
router.get("/profile", employerController.getProfile);
router.put("/profile", employerController.updateProfile);
router.delete("/profile", employerController.deleteAccount);

// Credential verification
router.post("/verify-credential", employerController.verifyCredential);
router.post("/bulk-verify", jobController.bulkVerifyCredentials);

// Learner search
router.get("/search-learners", employerController.searchLearners);

// Job routes
router.post("/jobs/create", jobController.createJob);
router.get("/matches", jobController.getJobMatches);
router.get("/jobs", jobController.getJobs);
router.get("/jobs/:id", jobController.getJob);
router.put("/jobs/:id", jobController.updateJob);
router.delete("/jobs/:id", jobController.deleteJob);

// Talent pool
router.get("/talent-pool", jobController.getTalentPool);
router.post("/talent-pool/add", jobController.addToTalentPool);
router.post("/talent-pool/remove", jobController.removeFromTalentPool);

// Invitations
router.post("/invite/:learnerId", jobController.inviteLearner);

// Analytics
router.get("/reports/hires", jobController.getHiringAnalytics);

export default router;
