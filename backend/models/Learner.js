import mongoose from 'mongoose';
import User from './User.js';

const learnerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  dateOfBirth: Date,
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    startDate: Date,
    endDate: Date,
    current: Boolean
  }],
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    verified: Boolean
  }],
  credentials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credential'
  }],
  profilePicture: String,
  bio: String,
  linkedInUrl: String,
  portfolioUrl: String
}, {
  timestamps: true
});

export default User.discriminator('Learner', learnerSchema);
