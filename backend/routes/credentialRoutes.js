import express from "express";
import * as credentialController from "../controllers/credentialController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { validateMultipart, schemas } from "../middleware/validation.js";
import upload from "../config/cloudinary.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(credentialController.getCredentials)
  .post(
    restrictTo("institution"),
    upload.single("file"),
    validateMultipart(schemas.createCredential),
    credentialController.createCredential,
  );

router
  .route("/:id")
  .get(credentialController.getCredential)
  .put(
    restrictTo("institution", "admin"),
    credentialController.updateCredential,
  )
  .delete(
    restrictTo("institution", "admin"),
    credentialController.deleteCredential,
  );

router.put(
  "/:id/verify",
  restrictTo("institution", "admin"),
  credentialController.verifyCredential,
);

export default router;
