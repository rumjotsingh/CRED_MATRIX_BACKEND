import Portfolio from "../models/Portfolio.js";
import Learner from "../models/Learner.js";
import Credential from "../models/Credential.js";
import Achievement from "../models/Achievement.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import crypto from "crypto";

/**
 * @desc    Get authenticated learner's portfolio
 * @route   GET /api/v1/learners/portfolio
 * @access  Private (Learner)
 */
export const getMyPortfolio = catchAsync(async (req, res, next) => {
  const portfolio = await Portfolio.findOne({ learnerId: req.user.id });

  if (!portfolio) {
    return next(new AppError("Portfolio not found", 404));
  }

  res.status(200).json({
    success: true,
    data: portfolio,
  });
});

/**
 * @desc    Unshare / revoke share token
 * @route   POST /api/v1/learners/portfolio/unshare
 * @access  Private (Learner)
 */
export const unsharePortfolio = catchAsync(async (req, res, next) => {
  const portfolio = await Portfolio.findOne({ learnerId: req.user.id });

  if (!portfolio) {
    return next(new AppError("Portfolio not found", 404));
  }

  portfolio.shareToken = null;
  portfolio.isPublic = false;
  await portfolio.save();

  res.status(200).json({
    success: true,
    message: "Portfolio unshared successfully",
    data: portfolio,
  });
});

/**
 * @desc    Delete portfolio
 * @route   DELETE /api/v1/learners/portfolio
 * @access  Private (Learner)
 */
export const deletePortfolio = catchAsync(async (req, res, next) => {
  const portfolio = await Portfolio.findOneAndDelete({
    learnerId: req.user.id,
  });

  if (!portfolio) {
    return next(new AppError("Portfolio not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Portfolio deleted successfully",
  });
});

/**
 * @desc    Create/Update portfolio
 * @route   POST /api/v1/learners/portfolio/create
 * @access  Private (Learner)
 */
export const createPortfolio = catchAsync(async (req, res, next) => {
  const { theme, sections, customization, isPublic } = req.body;

  let portfolio = await Portfolio.findOne({ learnerId: req.user.id });

  if (portfolio) {
    // Update existing portfolio
    portfolio.theme = theme || portfolio.theme;
    portfolio.sections = { ...portfolio.sections, ...sections };
    portfolio.customization = { ...portfolio.customization, ...customization };
    portfolio.isPublic = isPublic !== undefined ? isPublic : portfolio.isPublic;
    await portfolio.save();
  } else {
    // Create new portfolio
    portfolio = await Portfolio.create({
      learnerId: req.user.id,
      theme,
      sections,
      customization,
      isPublic,
    });
  }

  res.status(200).json({
    success: true,
    data: portfolio,
  });
});

/**
 * @desc    Generate share token
 * @route   POST /api/v1/learners/portfolio/share
 * @access  Private (Learner)
 */
export const generateShareToken = catchAsync(async (req, res, next) => {
  let portfolio = await Portfolio.findOne({ learnerId: req.user.id });

  if (!portfolio) {
    return next(
      new AppError("Portfolio not found. Please create one first.", 404),
    );
  }

  // Generate unique token
  const shareToken = crypto.randomBytes(32).toString("hex");
  portfolio.shareToken = shareToken;
  portfolio.isPublic = true;
  portfolio.lastShared = Date.now();
  await portfolio.save();

  const shareUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/portfolio/${shareToken}`;

  res.status(200).json({
    success: true,
    data: {
      shareToken,
      shareUrl,
      portfolio,
    },
  });
});

/**
 * @desc    View public portfolio
 * @route   GET /api/v1/learners/portfolio/:token
 * @access  Public
 */
export const viewPortfolio = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const portfolio = await Portfolio.findOne({
    shareToken: token,
    isPublic: true,
  }).populate({
    path: "learnerId",
    select: "firstName lastName bio skills education linkedInUrl portfolioUrl",
  });

  if (!portfolio) {
    return next(new AppError("Portfolio not found or not public", 404));
  }

  // Use populated learner when available, otherwise fetch by id
  let learner = portfolio.learnerId;
  const learnerId = learner && learner._id ? learner._id : portfolio.learnerId;
  console.log("Viewing portfolio for learner ID:", learnerId);
  if (!learner) {
    learner = await Learner.findById(learnerId);
  }

  if (!learner) {
    return next(
      new AppError("Learner associated with this portfolio not found", 404),
    );
  }

  // Get credentials
  const credentials = await Credential.find({
    learnerId: learnerId,
    verificationStatus: "verified",
    isPublic: true,
  }).populate("institutionId", "name type");

  // Get achievements
  const achievements = await Achievement.find({
    learnerId: learnerId,
    isPublic: true,
  });

  // Track view
  portfolio.views += 1;
  portfolio.viewHistory.push({
    timestamp: Date.now(),
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });
  await portfolio.save();

  res.status(200).json({
    success: true,
    data: {
      portfolio,
      learner: {
        firstName: learner.firstName,
        lastName: learner.lastName,
        bio: learner.bio,
        skills: learner.skills,
        education: learner.education,
        linkedInUrl: learner.linkedInUrl,
        portfolioUrl: learner.portfolioUrl,
      },
      credentials: portfolio.sections.showCredentials ? credentials : [],
      achievements: portfolio.sections.showAchievements ? achievements : [],
    },
  });
});

/**
 * @desc    Get portfolio analytics
 * @route   GET /api/v1/learners/analytics/views
 * @access  Private (Learner)
 */
export const getPortfolioAnalytics = catchAsync(async (req, res, next) => {
  const portfolio = await Portfolio.findOne({ learnerId: req.user.id });

  if (!portfolio) {
    return next(new AppError("Portfolio not found", 404));
  }

  // Calculate analytics
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentViews = portfolio.viewHistory.filter(
    (v) => v.timestamp >= last30Days,
  );

  const analytics = {
    totalViews: portfolio.views,
    viewsLast30Days: recentViews.length,
    lastViewed:
      portfolio.viewHistory.length > 0
        ? portfolio.viewHistory[portfolio.viewHistory.length - 1].timestamp
        : null,
    shareToken: portfolio.shareToken,
    isPublic: portfolio.isPublic,
  };

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

export default {
  createPortfolio,
  generateShareToken,
  viewPortfolio,
  getPortfolioAnalytics,
  getMyPortfolio,
  unsharePortfolio,
  deletePortfolio,
};
