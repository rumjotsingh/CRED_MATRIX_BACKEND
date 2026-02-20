import mongoose from 'mongoose';
import User from './User.js';

const employerSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  industry: {
    type: String,
    required: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  contactPerson: {
    firstName: String,
    lastName: String,
    designation: String,
    phone: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  website: String,
  logo: String,
  description: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  credentialsVerified: {
    type: Number,
    default: 0
  },
  jobPostings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting'
  }]
}, {
  timestamps: true
});

export default User.discriminator('Employer', employerSchema);
