import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    enum: ['default', 'modern', 'minimal', 'professional'],
    default: 'default'
  },
  sections: {
    showSkills: { type: Boolean, default: true },
    showEducation: { type: Boolean, default: true },
    showCredentials: { type: Boolean, default: true },
    showAchievements: { type: Boolean, default: true },
    showProjects: { type: Boolean, default: false }
  },
  customization: {
    primaryColor: String,
    headerImage: String,
    tagline: String
  },
  views: {
    type: Number,
    default: 0
  },
  viewHistory: [{
    timestamp: Date,
    ipAddress: String,
    userAgent: String
  }],
  lastShared: Date
}, {
  timestamps: true
});

export default mongoose.model('Portfolio', portfolioSchema);
