import User from '../models/User.js';
import Learner from '../models/Learner.js';
import Employer from '../models/Employer.js';
import Institution from '../models/Institution.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendTokenResponse, generateAccessToken, verifyRefreshToken } from '../utils/jwt.js';

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = catchAsync(async (req, res, next) => {
  const { 
    email, 
    password, 
    role, 
    firstName, 
    lastName, 
    companyName, 
    industry,
    institutionName,
    institutionType,
    registrationNumber
  } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  let user;

  // Create user based on role
  if (role === 'learner') {
    user = await Learner.create({
      email,
      password,
      role,
      firstName,
      lastName
    });
  } else if (role === 'employer') {
    user = await Employer.create({
      email,
      password,
      role,
      companyName,
      industry
    });
  } else if (role === 'institution') {
    // For institution, create the institution profile first
    if (!institutionName || !institutionType || !registrationNumber) {
      return next(new AppError('Institution name, type, and registration number are required', 400));
    }

    // Create institution
    const institution = await Institution.create({
      name: institutionName,
      type: institutionType,
      registrationNumber,
      contactInfo: {
        email
      },
      isVerified: false,
      isActive: true // Changed to true so institution can be used immediately
    });

    // Create user with tenantId
    user = await User.create({
      email,
      password,
      role,
      tenantId: institution._id
    });

    // Add user to institution administrators
    institution.administrators.push(user._id);
    await institution.save();

  } else {
    user = await User.create({ email, password, role });
  }

  sendTokenResponse(user, 201, res);
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid credentials', 401));
  }

  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 403));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Refresh access token
 * @route   POST /api/v1/auth/refresh
 * @access  Public
 */
export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError('Invalid refresh token', 401));
  }

  const accessToken = generateAccessToken(user._id);

  res.status(200).json({
    success: true,
    accessToken
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = catchAsync(async (req, res, next) => {
  req.user.refreshToken = undefined;
  await req.user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});
