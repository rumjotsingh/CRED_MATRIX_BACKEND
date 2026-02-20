import Institution from '../models/Institution.js';
import Credential from '../models/Credential.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import mongoose from 'mongoose';

/**
 * @desc    Create institution
 * @route   POST /api/v1/institutions
 * @access  Private (Admin)
 */
export const createInstitution = catchAsync(async (req, res, next) => {
  const institution = await Institution.create(req.body);

  res.status(201).json({
    success: true,
    data: institution
  });
});

/**
 * @desc    Get all institutions
 * @route   GET /api/v1/institutions
 * @access  Public
 */
export const getInstitutions = catchAsync(async (req, res, next) => {
  const { type, isVerified, isActive, page = 1, limit = 10 } = req.query;
 
  const query = {};
  
  // Only filter by isActive if explicitly provided, otherwise show all
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  if (type) query.type = type;
  if (isVerified !== undefined) query.isVerified = isVerified === 'true';

  const institutions = await Institution.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort('-createdAt');

  const count = await Institution.countDocuments(query);

  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: institutions
  });
});

/**
 * @desc    Get single institution
 * @route   GET /api/v1/institutions/:id
 * @access  Public
 */
export const getInstitution = catchAsync(async (req, res, next) => {
  const institution = await Institution.findById(req.params.id);

  if (!institution) {
    return next(new AppError('Institution not found', 404));
  }

  res.status(200).json({
    success: true,
    data: institution
  });
});

/**
 * @desc    Update institution
 * @route   PUT /api/v1/institutions/:id
 * @access  Private (Institution, Admin)
 */
export const updateInstitution = catchAsync(async (req, res, next) => {
  const institution = await Institution.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!institution) {
    return next(new AppError('Institution not found', 404));
  }

  res.status(200).json({
    success: true,
    data: institution
  });
});

/**
 * @desc    Delete institution
 * @route   DELETE /api/v1/institutions/:id
 * @access  Private (Admin)
 */
export const deleteInstitution = catchAsync(async (req, res, next) => {
  const institution = await Institution.findById(req.params.id);

  if (!institution) {
    return next(new AppError('Institution not found', 404));
  }

  // Remove reference from credentials issued by this institution
  await Credential.updateMany({ institutionId: institution._id }, { $unset: { institutionId: "" } });

  await institution.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Institution deleted successfully'
  });
});

/**
 * @desc    Get institution statistics
 * @route   GET /api/v1/institutions/:id/stats
 * @access  Private (Institution)
 */
export const getInstitutionStats = catchAsync(async (req, res, next) => {
  const institutionId = req.params.id;

  const totalCredentials = await Credential.countDocuments({ institutionId });
  const verifiedCredentials = await Credential.countDocuments({ 
    institutionId, 
    verificationStatus: 'verified' 
  });
  const pendingCredentials = await Credential.countDocuments({ 
    institutionId, 
    verificationStatus: 'pending' 
  });

  const credentialsByType = await Credential.aggregate([
    { $match: { institutionId: new mongoose.Types.ObjectId(institutionId) } },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalCredentials,
      verifiedCredentials,
      pendingCredentials,
      credentialsByType
    }
  });
});
