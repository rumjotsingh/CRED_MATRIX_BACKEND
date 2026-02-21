import express from "express";
import multer from "../config/multer.js";
import * as fileController from "../controllers/fileController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Upload file (certification, profile image, etc.)
router.post("/upload", multer.single("file"), fileController.uploadFile);

// Download file (redirects to Cloudinary URL)
router.get("/download", fileController.downloadFile);

export default router;
