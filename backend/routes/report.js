const express = require('express');
const Report = require('../models/Report');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Create a new pothole report
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { coordinates, date, riskPercentage, locationName, image } = req.body;
    if (!coordinates || !coordinates.lat || !coordinates.lng || !date || riskPercentage === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    console.log('Creating report with image data:', {
      hasImage: !!image,
      imageLength: image ? image.length : 0,
      imagePreview: image ? image.substring(0, 100) + '...' : 'None'
    });
    
    const report = new Report({
      user: req.user.userId,
      coordinates,
      date,
      riskPercentage,
      locationName: locationName || 'Unknown Location',
      image: image || null,
    });
    
    const savedReport = await report.save();
    console.log('Report saved successfully:', {
      id: savedReport._id,
      hasImage: !!savedReport.image,
      imageLength: savedReport.image ? savedReport.image.length : 0
    });
    
    res.status(201).json(savedReport);
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reports (public)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().populate('user', 'name email');
    console.log('Retrieved reports:', reports.length, 'total');
    reports.forEach((report, index) => {
      console.log(`Report ${index + 1}:`, {
        id: report._id,
        hasImage: !!report.image,
        imageLength: report.image ? report.image.length : 0
      });
    });
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a report
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Check if the user owns this report
    if (report.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }
    
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 