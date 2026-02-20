import Achievement from '../models/Achievement.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * @desc    Add achievement
 * @route   POST /api/v1/learners/achievements
 * @access  Private (Learner)
 */
export const addAchievement = catchAsync(async (req, res, next) => {
  const { title, description, type, date, organization, url, skills, isPublic } = req.body;

  const achievement = await Achievement.create({
    learnerId: req.user.id,
    title,
    description,
    type,
    date,
    organization,
    url,
    skills,
    isPublic
  });

  res.status(201).json({
    success: true,
    data: achievement
  });
});

/**
 * @desc    Get learner achievements
 * @route   GET /api/v1/learners/achievements
 * @access  Private (Learner)
 */
export const getAchievements = catchAsync(async (req, res, next) => {
  const achievements = await Achievement.find({ learnerId: req.user.id })
    .sort('-date');

  res.status(200).json({
    success: true,
    count: achievements.length,
    data: achievements
  });
});

/**
 * @desc    Update achievement
 * @route   PUT /api/v1/learners/achievements/:id
 * @access  Private (Learner)
 */
export const updateAchievement = catchAsync(async (req, res, next) => {
  const achievement = await Achievement.findOneAndUpdate(
    { _id: req.params.id, learnerId: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!achievement) {
    return next(new AppError('Achievement not found', 404));
  }

  res.status(200).json({
    success: true,
    data: achievement
  });
});

/**
 * @desc    Delete achievement
 * @route   DELETE /api/v1/learners/achievements/:id
 * @access  Private (Learner)
 */
export const deleteAchievement = catchAsync(async (req, res, next) => {
  const achievement = await Achievement.findOneAndDelete({
    _id: req.params.id,
    learnerId: req.user.id
  });

  if (!achievement) {
    return next(new AppError('Achievement not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Achievement deleted successfully'
  });
});

export default {
  addAchievement,
  getAchievements,
  updateAchievement,
  deleteAchievement
};
