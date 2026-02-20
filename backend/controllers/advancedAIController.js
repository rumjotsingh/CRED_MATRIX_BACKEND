import Learner from '../models/Learner.js';
import Credential from '../models/Credential.js';
import Job from '../models/Job.js';
import AppError from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import aiService from '../services/aiService.js';

/**
 * @desc    Get NSQF learning pathway recommendations
 * @route   GET /api/v1/ai/pathway/nsqf
 * @access  Private (Learner)
 */
export const getNSQFPathway = catchAsync(async (req, res, next) => {
  const learner = await Learner.findById(req.user.id);
  const credentials = await Credential.find({ learnerId: req.user.id });

  // Get current NSQF level
  const currentLevel = Math.max(...credentials.map(c => c.nsqfLevel || 0), 0);

  // Generate pathway recommendations
  const pathway = {
    currentLevel,
    nextLevel: currentLevel + 1,
    recommendations: []
  };

  // NSQF level progression recommendations
  const levelRecommendations = {
    0: {
      level: 1,
      title: 'Start with Basic Skills',
      courses: ['Basic Computer Skills', 'Communication Skills', 'Workplace Safety'],
      duration: '1-3 months'
    },
    1: {
      level: 2,
      title: 'Elementary Skills Development',
      courses: ['Basic Technical Skills', 'Team Collaboration', 'Problem Solving'],
      duration: '3-6 months'
    },
    2: {
      level: 3,
      title: 'Foundation Certificate',
      courses: ['Industry-specific Foundation Course', 'Practical Skills Training'],
      duration: '6-12 months'
    },
    3: {
      level: 4,
      title: 'Skilled Worker Certification',
      courses: ['Advanced Technical Skills', 'Quality Standards', 'Process Management'],
      duration: '1-2 years'
    },
    4: {
      level: 5,
      title: 'Diploma Program',
      courses: ['Professional Diploma', 'Specialized Training', 'Industry Certification'],
      duration: '2-3 years'
    },
    5: {
      level: 6,
      title: 'Bachelor Degree',
      courses: ['Undergraduate Degree Program', 'Professional Certification'],
      duration: '3-4 years'
    },
    6: {
      level: 7,
      title: 'Postgraduate Studies',
      courses: ['Masters Program', 'Advanced Professional Certification'],
      duration: '1-2 years'
    },
    7: {
      level: 8,
      title: 'Advanced Masters',
      courses: ['MBA', 'Specialized Masters', 'Executive Programs'],
      duration: '1-2 years'
    },
    8: {
      level: 9,
      title: 'Doctoral Studies',
      courses: ['PhD Program', 'Research Fellowship', 'Advanced Research'],
      duration: '3-5 years'
    },
    9: {
      level: 10,
      title: 'Post-Doctoral Research',
      courses: ['Post-Doctoral Fellowship', 'Research Leadership'],
      duration: '2-3 years'
    }
  };

  if (currentLevel < 10) {
    pathway.recommendations.push(levelRecommendations[currentLevel]);
  }

  // Add skill-based recommendations
  const skillGap = await aiService.analyzeSkillGap(
    learner.skills.map(s => s.name),
    'Software Developer'
  );

  pathway.skillRecommendations = skillGap.recommendations;

  res.status(200).json({
    success: true,
    data: pathway
  });
});

/**
 * @desc    Recommend next credentials based on current profile
 * @route   POST /api/v1/ai/pathway/recommend
 * @access  Private (Learner)
 */
export const recommendNextCredentials = catchAsync(async (req, res, next) => {
  const learner = await Learner.findById(req.user.id);
  const credentials = await Credential.find({ learnerId: req.user.id });

  const currentSkills = learner.skills.map(s => s.name.toLowerCase());
  const currentLevel = Math.max(...credentials.map(c => c.nsqfLevel || 0), 0);

  // Recommend credentials based on skills and level
  const recommendations = [];

  // Skill-based recommendations
  const skillCategories = {
    'web development': [
      'Advanced React Certification',
      'Full Stack Development Diploma',
      'Cloud Architecture Certificate'
    ],
    'data science': [
      'Machine Learning Specialization',
      'Data Analytics Professional Certificate',
      'AI Engineering Diploma'
    ],
    'mobile development': [
      'iOS Development Certificate',
      'Android Development Professional',
      'Cross-Platform Mobile Development'
    ]
  };

  // Check which category matches learner's skills
  for (const [category, creds] of Object.entries(skillCategories)) {
    if (currentSkills.some(skill => category.includes(skill) || skill.includes(category.split(' ')[0]))) {
      recommendations.push(...creds.map(title => ({
        title,
        category,
        estimatedLevel: currentLevel + 1,
        reason: `Based on your ${category} skills`
      })));
    }
  }

  // Level-based recommendations
  if (currentLevel < 5) {
    recommendations.push({
      title: 'Professional Diploma in Your Field',
      category: 'general',
      estimatedLevel: 5,
      reason: 'Progress to diploma level'
    });
  } else if (currentLevel < 7) {
    recommendations.push({
      title: 'Bachelor Degree Program',
      category: 'general',
      estimatedLevel: 7,
      reason: 'Advance to degree level'
    });
  }

  res.status(200).json({
    success: true,
    currentLevel,
    count: recommendations.length,
    data: recommendations.slice(0, 10)
  });
});

/**
 * @desc    Match learner to jobs using AI
 * @route   POST /api/v1/ai/job-match
 * @access  Private (Learner)
 */
export const matchLearnerToJobs = catchAsync(async (req, res, next) => {
  const learner = await Learner.findById(req.user.id);
  const credentials = await Credential.find({ learnerId: req.user.id });

  // Get all active jobs
  const jobs = await Job.find({ status: 'active' }).populate('employerId', 'companyName');

  const matches = [];

  for (const job of jobs) {
    const learnerSkills = learner.skills.map(s => s.name.toLowerCase());
    const requiredSkills = job.requiredSkills.map(s => s.name.toLowerCase());

    // Calculate skill match
    let matchedSkills = 0;
    requiredSkills.forEach(reqSkill => {
      if (learnerSkills.some(ls => ls.includes(reqSkill) || reqSkill.includes(ls))) {
        matchedSkills++;
      }
    });

    const skillMatchPercentage = (matchedSkills / requiredSkills.length) * 100;

    // Check NSQF level
    const maxNSQFLevel = Math.max(...credentials.map(c => c.nsqfLevel || 0), 0);
    const nsqfMatch = maxNSQFLevel >= (job.minNSQFLevel || 0);

    // Calculate overall match score
    const matchScore = Math.round(skillMatchPercentage * 0.7 + (nsqfMatch ? 30 : 0));

    if (matchScore >= 40) {
      matches.push({
        job: {
          _id: job._id,
          title: job.title,
          company: job.employerId.companyName,
          location: job.location,
          employmentType: job.employmentType,
          requiredSkills: job.requiredSkills
        },
        matchScore,
        matchedSkills,
        totalRequiredSkills: requiredSkills.length,
        missingSkills: requiredSkills.filter(rs => 
          !learnerSkills.some(ls => ls.includes(rs) || rs.includes(ls))
        )
      });
    }
  }

  // Sort by match score
  matches.sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json({
    success: true,
    count: matches.length,
    data: matches
  });
});

/**
 * @desc    Get market skill trends
 * @route   GET /api/v1/ai/trends/skills
 * @access  Public
 */
export const getSkillTrends = catchAsync(async (req, res, next) => {
  // Get all jobs and analyze required skills
  const jobs = await Job.find({ status: 'active' });

  const skillCount = {};

  jobs.forEach(job => {
    job.requiredSkills.forEach(skill => {
      const skillName = skill.name.toLowerCase();
      skillCount[skillName] = (skillCount[skillName] || 0) + 1;
    });
  });

  // Sort by demand
  const trendingSkills = Object.entries(skillCount)
    .map(([skill, count]) => ({
      skill,
      demand: count,
      trend: 'rising' // In production, compare with historical data
    }))
    .sort((a, b) => b.demand - a.demand)
    .slice(0, 20);

  // Add growth predictions
  const trends = {
    topSkills: trendingSkills,
    emergingSkills: [
      { skill: 'AI/ML', growth: '+45%', category: 'technical' },
      { skill: 'Cloud Computing', growth: '+38%', category: 'technical' },
      { skill: 'Cybersecurity', growth: '+35%', category: 'technical' },
      { skill: 'Data Science', growth: '+32%', category: 'technical' },
      { skill: 'DevOps', growth: '+30%', category: 'technical' }
    ],
    decliningSkills: [
      { skill: 'Legacy Systems', decline: '-15%', category: 'technical' }
    ]
  };

  res.status(200).json({
    success: true,
    data: trends
  });
});

export default {
  getNSQFPathway,
  recommendNextCredentials,
  matchLearnerToJobs,
  getSkillTrends
};
