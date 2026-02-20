import Job from "../models/Job.js";
import Learner from "../models/Learner.js";
import Credential from "../models/Credential.js";
import TalentPool from "../models/TalentPool.js";
import AppError from "../utils/appError.js";
import { catchAsync } from "../utils/catchAsync.js";
import aiService from "../services/aiService.js";

/**
 * @desc    Create job posting
 * @route   POST /api/v1/employers/jobs/create
 * @access  Private (Employer)
 */
export const createJob = catchAsync(async (req, res, next) => {
  const jobData = {
    ...req.body,
    employerId: req.user.id,
  };

  const job = await Job.create(jobData);

  res.status(201).json({
    success: true,
    data: job,
  });
});

/**
 * @desc    Get AI-matched learners for job
 * @route   GET /api/v1/employers/matches
 * @access  Private (Employer)
 */
export const getJobMatches = catchAsync(async (req, res, next) => {
  const { jobId } = req.query;

  const job = await Job.findOne({ _id: jobId, employerId: req.user.id });

  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  // Get all learners
  const learners = await Learner.find({}).populate("credentials");

  // Calculate match scores
  const matches = [];

  for (const learner of learners) {
    const learnerSkills = learner.skills.map((s) => s.name.toLowerCase());
    const requiredSkills = job.requiredSkills.map((s) => s.name.toLowerCase());

    // Calculate skill match
    let matchedSkills = 0;
    requiredSkills.forEach((reqSkill) => {
      if (
        learnerSkills.some(
          (ls) => ls.includes(reqSkill) || reqSkill.includes(ls),
        )
      ) {
        matchedSkills++;
      }
    });

    const skillMatchPercentage = (matchedSkills / requiredSkills.length) * 100;

    // Check NSQF level
    const credentials = await Credential.find({ learnerId: learner._id });
    const maxNSQFLevel = Math.max(
      ...credentials.map((c) => c.nsqfLevel || 0),
      0,
    );
    const nsqfMatch = maxNSQFLevel >= (job.minNSQFLevel || 0);

    // Calculate overall match score
    const matchScore = Math.round(
      skillMatchPercentage * 0.7 + (nsqfMatch ? 30 : 0),
    );

    if (matchScore >= 40) {
      matches.push({
        learner: {
          _id: learner._id,
          firstName: learner.firstName,
          lastName: learner.lastName,
          email: learner.email,
          skills: learner.skills,
          education: learner.education,
        },
        matchScore,
        matchedSkills: matchedSkills,
        totalRequiredSkills: requiredSkills.length,
        nsqfLevel: maxNSQFLevel,
      });
    }
  }

  // Sort by match score
  matches.sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json({
    success: true,
    count: matches.length,
    data: matches.slice(0, 20), // Top 20 matches
  });
});

/**
 * @desc    Bulk verify credentials
 * @route   POST /api/v1/employers/bulk-verify
 * @access  Private (Employer)
 */
export const bulkVerifyCredentials = catchAsync(async (req, res, next) => {
  const { credentialNumbers } = req.body;

  if (!Array.isArray(credentialNumbers) || credentialNumbers.length === 0) {
    return next(
      new AppError("Please provide an array of credential numbers", 400),
    );
  }

  const results = [];

  for (const credNumber of credentialNumbers) {
    const credential = await Credential.findOne({
      credentialNumber: credNumber,
    })
      .populate("learnerId", "firstName lastName email")
      .populate("institutionId", "name type");

    results.push({
      credentialNumber: credNumber,
      found: !!credential,
      verified: credential
        ? credential.verificationStatus === "verified"
        : false,
      credential: credential || null,
    });
  }

  res.status(200).json({
    success: true,
    total: credentialNumbers.length,
    verified: results.filter((r) => r.verified).length,
    notFound: results.filter((r) => !r.found).length,
    data: results,
  });
});

/**
 * @desc    Get/Create talent pool
 * @route   GET /api/v1/employers/talent-pool
 * @access  Private (Employer)
 */
export const getTalentPool = catchAsync(async (req, res, next) => {
  let talentPool = await TalentPool.findOne({
    employerId: req.user.id,
  }).populate("learners.learnerId", "firstName lastName email skills");

  if (!talentPool) {
    talentPool = await TalentPool.create({
      employerId: req.user.id,
      learners: [],
    });
  }

  res.status(200).json({
    success: true,
    count: talentPool.learners.length,
    data: talentPool,
  });
});

/**
 * @desc    Add learner to talent pool
 * @route   POST /api/v1/employers/talent-pool/add
 * @access  Private (Employer)
 */
export const addToTalentPool = catchAsync(async (req, res, next) => {
  const { learnerId, notes, tags, rating } = req.body;

  let talentPool = await TalentPool.findOne({ employerId: req.user.id });

  if (!talentPool) {
    talentPool = await TalentPool.create({
      employerId: req.user.id,
      learners: [],
    });
  }

  // Check if learner already in pool
  const exists = talentPool.learners.some(
    (l) => l.learnerId.toString() === learnerId,
  );

  if (exists) {
    return next(new AppError("Learner already in talent pool", 400));
  }

  talentPool.learners.push({
    learnerId,
    addedAt: Date.now(),
    notes,
    tags,
    rating,
  });

  await talentPool.save();

  res.status(200).json({
    success: true,
    data: talentPool,
  });
});

/**
 * @desc    Send job invite to learner
 * @route   POST /api/v1/employers/invite/:learnerId
 * @access  Private (Employer)
 */
export const inviteLearner = catchAsync(async (req, res, next) => {
  const { learnerId } = req.params;
  const { jobId, message } = req.body;

  const job = await Job.findOne({ _id: jobId, employerId: req.user.id });

  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  const learner = await Learner.findById(learnerId);

  if (!learner) {
    return next(new AppError("Learner not found", 404));
  }

  // Add to invited learners
  if (!job.invitedLearners.includes(learnerId)) {
    job.invitedLearners.push(learnerId);
    await job.save();
  }

  // In production, send email notification here

  res.status(200).json({
    success: true,
    message: "Invitation sent successfully",
    data: {
      job: job.title,
      learner: `${learner.firstName} ${learner.lastName}`,
    },
  });
});

/**
 * @desc    Get hiring analytics
 * @route   GET /api/v1/employers/reports/hires
 * @access  Private (Employer)
 */
export const getHiringAnalytics = catchAsync(async (req, res, next) => {
  const jobs = await Job.find({ employerId: req.user.id });

  const analytics = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j) => j.status === "active").length,
    closedJobs: jobs.filter((j) => j.status === "closed").length,
    totalApplicants: jobs.reduce((sum, j) => sum + j.applicants.length, 0),
    totalInvited: jobs.reduce((sum, j) => sum + j.invitedLearners.length, 0),
    hired: jobs.reduce(
      (sum, j) => sum + j.applicants.filter((a) => a.status === "hired").length,
      0,
    ),
    shortlisted: jobs.reduce(
      (sum, j) =>
        sum + j.applicants.filter((a) => a.status === "shortlisted").length,
      0,
    ),
    jobsByType: {},
  };

  // Group by employment type
  jobs.forEach((job) => {
    analytics.jobsByType[job.employmentType] =
      (analytics.jobsByType[job.employmentType] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: analytics,
  });
});

/**
 * @desc    Get all jobs for employer
 * @route   GET /api/v1/employers/jobs
 * @access  Private (Employer)
 */
export const getJobs = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = { employerId: req.user.id };
  if (status) query.status = status;

  const jobs = await Job.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort("-createdAt");

  const count = await Job.countDocuments(query);

  res.status(200).json({
    success: true,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    data: jobs,
  });
});

/**
 * @desc    Get single job (employer-only)
 * @route   GET /api/v1/employers/jobs/:id
 * @access  Private (Employer)
 */
export const getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findOne({
    _id: req.params.id,
    employerId: req.user.id,
  });

  if (!job) {
    return next(new AppError("Job not found", 404));
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

/**
 * @desc    Update job
 * @route   PUT /api/v1/employers/jobs/:id
 * @access  Private (Employer)
 */
export const updateJob = catchAsync(async (req, res, next) => {
  const job = await Job.findOneAndUpdate(
    { _id: req.params.id, employerId: req.user.id },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!job) {
    return next(new AppError("Job not found or not authorized", 404));
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

/**
 * @desc    Delete job
 * @route   DELETE /api/v1/employers/jobs/:id
 * @access  Private (Employer)
 */
export const deleteJob = catchAsync(async (req, res, next) => {
  const job = await Job.findOne({
    _id: req.params.id,
    employerId: req.user.id,
  });

  if (!job) {
    return next(new AppError("Job not found or not authorized", 404));
  }

  await job.deleteOne();

  res.status(200).json({
    success: true,
    message: "Job deleted successfully",
  });
});

/**
 * @desc    Remove learner from talent pool
 * @route   POST /api/v1/employers/talent-pool/remove
 * @access  Private (Employer)
 */
export const removeFromTalentPool = catchAsync(async (req, res, next) => {
  const { learnerId } = req.body;

  const talentPool = await TalentPool.findOne({ employerId: req.user.id });

  if (!talentPool) {
    return next(new AppError("Talent pool not found", 404));
  }

  const before = talentPool.learners.length;
  talentPool.learners = talentPool.learners.filter(
    (l) => l.learnerId.toString() !== learnerId,
  );

  if (talentPool.learners.length === before) {
    return next(new AppError("Learner not found in talent pool", 404));
  }

  await talentPool.save();

  res.status(200).json({
    success: true,
    data: talentPool,
  });
});

export default {
  createJob,
  getJobMatches,
  bulkVerifyCredentials,
  getTalentPool,
  addToTalentPool,
  inviteLearner,
  getHiringAnalytics,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  removeFromTalentPool,
};
