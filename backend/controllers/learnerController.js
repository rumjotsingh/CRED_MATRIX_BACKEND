import Learner from "../models/Learner.js";
import Credential from "../models/Credential.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import aiService from "../services/aiService.js";
import Portfolio from "../models/Portfolio.js";
import Achievement from "../models/Achievement.js";
import User from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js";

/**
 * @desc    Get learner profile
 * @route   GET /api/v1/learners/profile
 * @access  Private (Learner)
 */
export const getProfile = catchAsync(async (req, res, next) => {
  const learner = await Learner.findById(req.user.id).populate("credentials");

  if (!learner) {
    return next(new AppError("Learner not found", 404));
  }

  res.status(200).json({
    success: true,
    data: learner,
  });
});

/**
 * @desc    Update learner profile
 * @route   PUT /api/v1/learners/profile
 * @access  Private (Learner)
 */
export const updateProfile = catchAsync(async (req, res, next) => {
  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "address",
    "bio",
    "linkedInUrl",
    "portfolioUrl",
  ];
  const updates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const learner = await Learner.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: learner,
  });
});

/**
 * @desc    Add education
 * @route   POST /api/v1/learners/education
 * @access  Private (Learner)
 */
export const addEducation = catchAsync(async (req, res, next) => {
  const learner = await Learner.findById(req.user.id);

  learner.education.push(req.body);
  await learner.save();

  res.status(200).json({
    success: true,
    data: learner,
  });
});

/**
 * @desc    Add skill
 * @route   POST /api/v1/learners/skills
 * @access  Private (Learner)
 */
export const addSkill = catchAsync(async (req, res, next) => {
  const learner = await Learner.findById(req.user.id);

  learner.skills.push(req.body);
  await learner.save();

  res.status(200).json({
    success: true,
    data: learner,
  });
});

/**
 * @desc    Get career recommendations
 * @route   GET /api/v1/learners/career-recommendations
 * @access  Private (Learner)
 */
export const getCareerRecommendations = catchAsync(async (req, res, next) => {
  const learner = await Learner.findById(req.user.id).populate("credentials");

  const learnerProfile = {
    skills: learner.skills,
    education: learner.education,
    credentials: learner.credentials,
  };

  const recommendations =
    await aiService.getCareerRecommendations(learnerProfile);

  res.status(200).json({
    success: true,
    data: recommendations,
  });
});

/**
 * @desc    Get skill gap analysis
 * @route   POST /api/v1/learners/skill-gap
 * @access  Private (Learner)
 */
export const getSkillGapAnalysis = catchAsync(async (req, res, next) => {
  const { targetRole } = req.body;
  const learner = await Learner.findById(req.user.id);

  const currentSkills = learner.skills.map((s) => s.name);
  const analysis = await aiService.analyzeSkillGap(currentSkills, targetRole);

  res.status(200).json({
    success: true,
    data: analysis,
  });
});

/**
 * @desc    Get learner credentials
 * @route   GET /api/v1/learners/credentials
 * @access  Private (Learner)
 */
export const getCredentials = catchAsync(async (req, res, next) => {
  const credentials = await Credential.find({ learnerId: req.user.id })
    .populate("institutionId", "name type")
    .sort("-issueDate");

  res.status(200).json({
    success: true,
    count: credentials.length,
    data: credentials,
  });
});

/**
 * @desc    Delete learner account and related data
 * @route   DELETE /api/v1/learners/profile
 * @access  Private (Learner)
 */
export const deleteAccount = catchAsync(async (req, res, next) => {
  const learnerId = req.user.id;

  // Delete credentials and their files
  const creds = await Credential.find({ learnerId });
  for (const cred of creds) {
    if (cred.file && cred.file.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(cred.file.cloudinaryId);
      } catch (err) {
        console.error("Error deleting credential file from Cloudinary:", err);
      }
    }
    await cred.deleteOne();
  }

  // Delete portfolio
  await Portfolio.findOneAndDelete({ learnerId });

  // Delete achievements
  await Achievement.deleteMany({ learnerId });

  // Delete learner document
  await Learner.findByIdAndDelete(learnerId);

  // Optionally delete user account
  await User.findByIdAndDelete(learnerId);

  res.status(200).json({
    success: true,
    message: "Learner account and related data deleted successfully",
  });
});
