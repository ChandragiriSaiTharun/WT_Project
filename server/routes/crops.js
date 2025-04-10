const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

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
    const insertQuery = `
      INSERT INTO crops (name, image, price, quantity, unit, seller, location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.promise().query(insertQuery, [
      cropName, image, cropPrice, cropQuantity, cropUnit, sellerName, location
    ]);
    console.log('Crop added successfully:', result);

    res.status(200).json({ message: 'Crop added successfully!', cropId: result.insertId });
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
    const selectQuery = `
      SELECT id, name, image, price, quantity, unit, seller, location, added_date
      FROM crops
      ORDER BY added_date DESC
    `;
    const [crops] = await db.promise().query(selectQuery);
    console.log('Fetched crops:', crops);

    // Add full image URL to each crop
    const cropsWithImageUrl = crops.map(crop => ({
      ...crop,
      imageUrl: crop.image ? `/crop/${crop.image}` : null
    }));

    res.status(200).json(cropsWithImageUrl);
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

module.exports = router;