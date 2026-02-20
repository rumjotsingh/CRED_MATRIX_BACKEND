import Employer from "../models/Employer.js";
import Credential from "../models/Credential.js";
import Learner from "../models/Learner.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { verifyFileHash } from "../utils/fileHash.js";
import Job from "../models/Job.js";
import TalentPool from "../models/TalentPool.js";
import User from "../models/User.js";

/**
 * @desc    Get employer profile
 * @route   GET /api/v1/employers/profile
 * @access  Private (Employer)
 */
export const getProfile = catchAsync(async (req, res, next) => {
  const employer = await Employer.findById(req.user.id);

  if (!employer) {
    return next(new AppError("Employer not found", 404));
  }

  res.status(200).json({
    success: true,
    data: employer,
  });
});

/**
 * @desc    Update employer profile
 * @route   PUT /api/v1/employers/profile
 * @access  Private (Employer)
 */
export const updateProfile = catchAsync(async (req, res, next) => {
  const allowedFields = [
    "companyName",
    "industry",
    "companySize",
    "contactPerson",
    "address",
    "website",
    "description",
  ];
  const updates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const employer = await Employer.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: employer,
  });
});

/**
 * @desc    Verify credential authenticity
 * @route   POST /api/v1/employers/verify-credential
 * @access  Private (Employer)
 */
export const verifyCredential = catchAsync(async (req, res, next) => {
  const { credentialNumber, fileHash } = req.body;

  const credential = await Credential.findOne({ credentialNumber })
    .populate("learnerId", "firstName lastName email")
    .populate("institutionId", "name type contactInfo");

  if (!credential) {
    return res.status(200).json({
      success: true,
      verified: false,
      message: "Credential not found",
    });
  }

  // Verify file hash if provided
  let hashMatch = true;
  if (fileHash && credential.file.hash) {
    hashMatch = fileHash === credential.file.hash;
  }

  // Update employer's verification count
  await Employer.findByIdAndUpdate(req.user.id, {
    $inc: { credentialsVerified: 1 },
  });

  res.status(200).json({
    success: true,
    verified: true,
    hashMatch,
    data: {
      credential,
      verificationDate: new Date(),
    },
  });
});

/**
 * @desc    Search learners by skills
 * @route   GET /api/v1/employers/search-learners
 * @access  Private (Employer)
 */
export const searchLearners = catchAsync(async (req, res, next) => {
  const { skills, nsqfLevel, page = 1, limit = 10 } = req.query;

  const query = {};

  if (skills) {
    const skillArray = skills.split(",").map((s) => s.trim());
    query["skills.name"] = { $in: skillArray };
  }

  const learners = await Learner.find(query)
    .select("firstName lastName email skills education")
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Get credentials for each learner
  const learnersWithCredentials = await Promise.all(
    learners.map(async (learner) => {
      const credentials = await Credential.find({
        learnerId: learner._id,
        verificationStatus: "verified",
        isPublic: true,
      }).select("title type nsqfLevel issueDate");

      return {
        ...learner.toObject(),
        credentials,
      };
    }),
  );

  res.status(200).json({
    success: true,
    count: learnersWithCredentials.length,
    data: learnersWithCredentials,
  });
});

/**
 * @desc    Delete employer account and related data
 * @route   DELETE /api/v1/employers/profile
 * @access  Private (Employer)
 */
export const deleteAccount = catchAsync(async (req, res, next) => {
  const employerId = req.user.id;

  // Delete jobs
  await Job.deleteMany({ employerId });

  // Delete talent pool
  await TalentPool.findOneAndDelete({ employerId });

  // Delete employer document
  await Employer.findByIdAndDelete(employerId);

  // Delete user account
  await User.findByIdAndDelete(employerId);

  res.status(200).json({
    success: true,
    message: "Employer account and related data deleted successfully",
  });
});
