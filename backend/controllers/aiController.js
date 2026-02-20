import AppError from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import aiService from '../services/aiService.js';

/**
 * @desc    Extract skills from text
 * @route   POST /api/v1/ai/extract-skills
 * @access  Private
 */
export const extractSkills = catchAsync(async (req, res, next) => {
  const { text } = req.body;

  if (!text) {
    return next(new AppError('Text is required', 400));
  }

  const skills = await aiService.extractSkills(text);

  res.status(200).json({
    success: true,
    data: { skills }
  });
});

/**
 * @desc    Predict NSQF level
 * @route   POST /api/v1/ai/predict-nsqf
 * @access  Private
 */
export const predictNSQFLevel = catchAsync(async (req, res, next) => {
  const credentialData = req.body;

  const nsqfLevel = await aiService.predictNSQFLevel(credentialData);

  res.status(200).json({
    success: true,
    data: { nsqfLevel }
  });
});

/**
 * @desc    Get career recommendations
 * @route   POST /api/v1/ai/career-recommendations
 * @access  Private (Learner)
 */
export const getCareerRecommendations = catchAsync(async (req, res, next) => {
  const learnerProfile = req.body;

  const recommendations = await aiService.getCareerRecommendations(learnerProfile);

  res.status(200).json({
    success: true,
    data: { recommendations }
  });
});

/**
 * @desc    Analyze skill gap
 * @route   POST /api/v1/ai/skill-gap
 * @access  Private (Learner)
 */
export const analyzeSkillGap = catchAsync(async (req, res, next) => {
  const { currentSkills, targetRole } = req.body;

  if (!currentSkills || !targetRole) {
    return next(new AppError('Current skills and target role are required', 400));
  }

  const analysis = await aiService.analyzeSkillGap(currentSkills, targetRole);

  res.status(200).json({
    success: true,
    data: analysis
  });
});
