import mongoose from 'mongoose';

const talentPoolSchema = new mongoose.Schema({
  employerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  learners: [{
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: Date,
    notes: String,
    tags: [String],
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }]
}, {
  timestamps: true
});

export default mongoose.model('TalentPool', talentPoolSchema);
