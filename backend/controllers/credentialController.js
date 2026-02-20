import Credential from "../models/Credential.js";
import Institution from "../models/Institution.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import aiService from "../services/aiService.js";
import crypto from "crypto";

/**
 * Generate hash from Cloudinary URL
 */
const generateCloudinaryHash = (url) => {
  return crypto.createHash("sha256").update(url).digest("hex");
};

/**
 * @desc    Create credential
 * @route   POST /api/v1/credentials
 * @access  Private (Institution)
 */
export const createCredential = catchAsync(async (req, res, next) => {
  const {
    learnerId,
    title,
    description,
    type,
    category,
    issueDate,
    expiryDate,
    credentialNumber,
  } = req.body;

  if (!req.file) {
    return next(new AppError("Please upload a credential file", 400));
  }

  // Generate hash from Cloudinary URL for verification
  const fileHash = generateCloudinaryHash(req.file.path);

  // AI: Extract skills and predict NSQF level
  const aiAnalysis = await aiService.analyzeCredential(description);

  const credential = await Credential.create({
    learnerId,
    institutionId: req.user.tenantId,
    title,
    description,
    type,
    category,
    issueDate,
    expiryDate,
    credentialNumber,
    skills: aiAnalysis.skills,
    nsqfLevel: aiAnalysis.nsqfLevel,
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path, // Cloudinary URL
      mimetype: req.file.mimetype,
      size: req.file.size,
      hash: fileHash,
      cloudinaryId: req.file.filename, // Store Cloudinary public_id for deletion
    },
  });

  // Update institution credentials count
  await Institution.findByIdAndUpdate(req.user.tenantId, {
    $inc: { credentialsIssued: 1 },
  });

  res.status(201).json({
    success: true,
    data: credential,
  });
});

/**
 * @desc    Get all credentials
 * @route   GET /api/v1/credentials
 * @access  Private
 */
export const getCredentials = catchAsync(async (req, res, next) => {
  let query = {};

  // Filter based on role
  if (req.user.role === "learner") {
    query.learnerId = req.user.id;
  } else if (req.user.role === "institution") {
    query.institutionId = req.user.tenantId;
  }

  const credentials = await Credential.find(query)
    .populate("learnerId", "firstName lastName email")
    .populate("institutionId", "name type")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: credentials.length,
    data: credentials,
  });
});

/**
 * @desc    Get single credential
 * @route   GET /api/v1/credentials/:id
 * @access  Private
 */
export const getCredential = catchAsync(async (req, res, next) => {
  const credential = await Credential.findById(req.params.id)
    .populate("learnerId", "firstName lastName email")
    .populate("institutionId", "name type contactInfo");

  if (!credential) {
    return next(new AppError("Credential not found", 404));
  }

  // Increment view count
  credential.viewCount += 1;
  await credential.save();

  res.status(200).json({
    success: true,
    data: credential,
  });
});

/**
 * @desc    Update credential metadata
 * @route   PUT /api/v1/credentials/:id
 * @access  Private (Institution, Admin)
 */
export const updateCredential = catchAsync(async (req, res, next) => {
  const credential = await Credential.findById(req.params.id);

  if (!credential) {
    return next(new AppError("Credential not found", 404));
  }

  // Only issuing institution or admin can update
  if (
    req.user.role !== "admin" &&
    credential.institutionId.toString() !== req.user.tenantId
  ) {
    return next(new AppError("Not authorized to update this credential", 403));
  }

  const allowed = [
    "title",
    "description",
    "issueDate",
    "expiryDate",
    "type",
    "category",
    "isPublic",
    "credentialNumber",
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) credential[field] = req.body[field];
  });

  await credential.save();

  res.status(200).json({
    success: true,
    data: credential,
  });
});

/**
 * @desc    Verify credential
 * @route   PUT /api/v1/credentials/:id/verify
 * @access  Private (Institution, Admin)
 */
export const verifyCredential = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  const credential = await Credential.findById(req.params.id);

  if (!credential) {
    return next(new AppError("Credential not found", 404));
  }

  credential.verificationStatus = status;
  credential.verifiedBy = req.user.id;
  credential.verifiedAt = Date.now();

  await credential.save();

  res.status(200).json({
    success: true,
    data: credential,
  });
});

/**
 * @desc    Delete credential
 * @route   DELETE /api/v1/credentials/:id
 * @access  Private (Institution, Admin)
 */
export const deleteCredential = catchAsync(async (req, res, next) => {
  const credential = await Credential.findById(req.params.id);

  if (!credential) {
    return next(new AppError("Credential not found", 404));
  }

  // Delete file from Cloudinary if it exists
  if (credential.file && credential.file.cloudinaryId) {
    try {
      const { cloudinary } = await import("../config/cloudinary.js");
      await cloudinary.uploader.destroy(credential.file.cloudinaryId);
    } catch (error) {
      console.error("Error deleting file from Cloudinary:", error);
    }
  }

  await credential.deleteOne();

  res.status(200).json({
    success: true,
    message: "Credential deleted successfully",
  });
});
