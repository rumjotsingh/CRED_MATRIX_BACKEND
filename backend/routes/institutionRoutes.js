import express from "express";
import * as institutionController from "../controllers/institutionController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.get("/", institutionController.getInstitutions);
router.get("/:id", institutionController.getInstitution);

router.use(protect);

router.post("/", restrictTo("admin"), institutionController.createInstitution);

router
  .route("/:id")
  .put(
    restrictTo("institution", "admin"),
    institutionController.updateInstitution,
  )
  .delete(restrictTo("admin"), institutionController.deleteInstitution);

router.get(
  "/:id/stats",
  restrictTo("institution", "admin"),
  institutionController.getInstitutionStats,
);

export default router;
