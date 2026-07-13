import mongoose from 'mongoose';

const DeviceRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  oldToken: {
    type: String,
    default: ''
  },
  newToken: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  requestedTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('DeviceRequest', DeviceRequestSchema);
