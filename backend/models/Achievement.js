import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  learnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['award', 'competition', 'project', 'publication', 'volunteer', 'other'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  organization: String,
  url: String,
  skills: [String],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Achievement', achievementSchema);
