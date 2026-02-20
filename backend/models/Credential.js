import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Credential title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  type: {
    type: String,
    enum: ['certificate', 'diploma', 'badge', 'micro-credential', 'degree', 'other'],
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'soft-skills', 'management', 'healthcare', 'education', 'finance', 'other']
  },
  nsqfLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  skills: [{
    name: String,
    category: String
  }],
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: Date,
  credentialNumber: {
    type: String,
    required: true,
    unique: true
  },
  file: {
    filename: String,
    originalName: String,
    path: String, // Cloudinary URL
    mimetype: String,
    size: Number,
    hash: String,
    cloudinaryId: String, // Cloudinary public_id for deletion
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'expired'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  metadata: {
    duration: String,
    credits: Number,
    grade: String,
    assessmentType: String
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  shareableLink: String,
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
credentialSchema.index({ learnerId: 1, institutionId: 1 });
credentialSchema.index({ credentialNumber: 1 });
credentialSchema.index({ verificationStatus: 1 });

export default mongoose.model('Credential', credentialSchema);
