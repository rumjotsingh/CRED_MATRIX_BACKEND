import User from '../models/User.js';
import Institution from '../models/Institution.js';
import Credential from '../models/Credential.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * @desc    Get platform statistics
 * @route   GET /api/v1/admin/stats
 * @access  Private (Admin)
 */
export const getPlatformStats = catchAsync(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const totalLearners = await User.countDocuments({ role: 'learner' });
  const totalInstitutions = await Institution.countDocuments();
  const totalEmployers = await User.countDocuments({ role: 'employer' });
  const totalCredentials = await Credential.countDocuments();
  const verifiedCredentials = await Credential.countDocuments({ verificationStatus: 'verified' });
  const pendingCredentials = await Credential.countDocuments({ verificationStatus: 'pending' });

  const credentialsByType = await Credential.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  const credentialsByMonth = await Credential.aggregate([
    {
      $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        learners: totalLearners,
        institutions: totalInstitutions,
        employers: totalEmployers
      },
      credentials: {
        total: totalCredentials,
        verified: verifiedCredentials,
        pending: pendingCredentials,
        byType: credentialsByType,
        byMonth: credentialsByMonth
      }
    }
  });
});

/**
 * @desc    Get all users
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin)
 */
export const getAllUsers = catchAsync(async (req, res, next) => {
  const { role, isActive, page = 1, limit = 20 } = req.query;

  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const users = await User.find(query)
    .select('-password -refreshToken')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort('-createdAt');

  const count = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    data: users
  });
});

/**
 * @desc    Update user status
 * @route   PUT /api/v1/admin/users/:id/status
 * @access  Private (Admin)
 */
export const updateUserStatus = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Verify institution
 * @route   PUT /api/v1/admin/institutions/:id/verify
 * @access  Private (Admin)
 */
export const verifyInstitution = catchAsync(async (req, res, next) => {
  const { isVerified, isActive } = req.body;

  const updateData = {};
  if (isVerified !== undefined) updateData.isVerified = isVerified;
  if (isActive !== undefined) updateData.isActive = isActive;

  const institution = await Institution.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!institution) {
    return next(new AppError('Institution not found', 404));
  }

  res.status(200).json({
    success: true,
    data: institution
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});
