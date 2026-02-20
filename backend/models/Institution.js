import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Institution name is required'],
    unique: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true
  },
  type: {
    type: String,
    enum: ['university', 'college', 'training-center', 'online-platform', 'government', 'other'],
    required: true
  },
  accreditation: {
    body: String,
    number: String,
    validUntil: Date
  },
  contactInfo: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: String,
    website: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  logo: String,
  description: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  credentialsIssued: {
    type: Number,
    default: 0
  },
  administrators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

export default mongoose.model('Institution', institutionSchema);
