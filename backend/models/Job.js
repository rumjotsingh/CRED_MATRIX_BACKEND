import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  requiredSkills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    mandatory: Boolean
  }],
  preferredSkills: [String],
  minNSQFLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  location: {
    city: String,
    state: String,
    country: String,
    remote: Boolean
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    required: true
  },
  experienceRequired: {
    min: Number,
    max: Number
  },
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  applicants: [{
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
      default: 'pending'
    },
    matchScore: Number
  }],
  invitedLearners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  postedDate: {
    type: Date,
    default: Date.now
  },
  closingDate: Date
}, {
  timestamps: true
});

export default mongoose.model('Job', jobSchema);
