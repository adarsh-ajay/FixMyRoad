const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  date: { type: Date, required: true },
  riskPercentage: { type: Number, required: true },
  status: { type: String, default: 'Reported' }, // e.g., Reported, In Progress, Resolved
  actionsTaken: { type: String, default: '' },
  locationName: { type: String, default: 'Unknown Location' },
  image: { type: String, maxlength: 16777216 }, // Base64 encoded image data (16MB max)
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema); 