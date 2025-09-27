const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Crop = require('../models/Crop');

// File Upload Setup for Crop Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/crop');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created uploads directory:', uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Please login to perform this action' });
  }
  next();
};

// POST /crops - Add a new crop
router.post('/', isAuthenticated, upload.single('cropImage'), async (req, res) => {
  console.log('Received POST /crops request');
  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file);

  const { cropName, cropUnit, cropQuantity, cropPrice, sellerName, location } = req.body;
  const image = req.file ? req.file.filename : null;
  const filePath = req.file ? path.join(__dirname, '../../uploads/crop', req.file.filename) : null;

  if (!cropName || !cropUnit || !cropQuantity || !cropPrice || !sellerName || !location) {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Delete uploaded file if validation fails
    }
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Create new crop document
    const newCrop = new Crop({
      name: cropName,
      image,
      price: cropPrice,
      quantity: cropQuantity,
      unit: cropUnit,
      seller: sellerName,
      location
    });
    
    const savedCrop = await newCrop.save();
    console.log('Crop added successfully:', savedCrop._id);

    res.status(200).json({ message: 'Crop added successfully!', cropId: savedCrop._id });
  } catch (error) {
    console.error('Error adding crop:', error);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Delete file on error
    }
    res.status(500).json({ error: 'Failed to add crop' });
  }
});

// GET /crops - Retrieve all crops
router.get('/', async (req, res) => {
  console.log('Received GET /crops request');

  try {
    // Fetch all crops, sorted by newest first
    const crops = await Crop.find()
      .sort({ addedDate: -1 })
      .lean(); // Use lean() for better performance when we don't need mongoose document methods
    
    console.log('Fetched crops:', crops);

    // Add full image URL to each crop and convert _id to id for compatibility
    const cropsWithImageUrl = crops.map(crop => ({
      id: crop._id,
      name: crop.name,
      image: crop.image,
      price: crop.price,
      quantity: crop.quantity,
      unit: crop.unit,
      seller: crop.seller,
      location: crop.location,
      added_date: crop.addedDate,
      imageUrl: crop.image ? `/crop/${crop.image}` : null
    }));

    res.status(200).json(cropsWithImageUrl);
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

module.exports = router;