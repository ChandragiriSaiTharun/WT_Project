const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
const Farmer = require('../models/Farmer');
const fs = require('fs');
const path = require('path');

// File Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profile'); // Absolute path to /home/rgukt/project/kisaanconnect/uploads
    // Ensure the directory exists
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

// Register Endpoint
router.post('/', upload.single('profilePicture'), async (req, res) => {
  console.log('Received POST /register request');
  console.log('Request body:', req.body);
  console.log('Uploaded file:', req.file);

  const {
    fullName, phoneNumber, email, password, inputState, inputDistrict, village_town, pinCode
  } = req.body;
  const profilePicture = req.file ? req.file.filename : null;
  const filePath = req.file ? path.join(__dirname, '../../uploads/profile', req.file.filename) : null;

  console.log('Parsed form data:', {
    fullName, phoneNumber, email, password, inputState, inputDistrict, village_town, pinCode, profilePicture
  });
  console.log('Calculated file path:', filePath);
  // Verify file exists after upload
  if (filePath) {
    console.log('File exists after upload:', fs.existsSync(filePath));
  }

  try {
    console.log('Checking for duplicate phone number or email:', phoneNumber, email);
    
    // Check for existing farmer with same phone number or email
    const existingFarmer = await Farmer.findOne({
      $or: [
        { phoneNumber: phoneNumber },
        { email: email || null }
      ]
    });
    
    console.log('Duplicate check result:', existingFarmer);

    if (existingFarmer) {
      if (existingFarmer.phoneNumber === phoneNumber) {
        console.log('Duplicate phone number found');
        if (filePath && fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
            else console.log('Duplicate file deleted:', filePath);
          });
        } else {
          console.log('File not found at:', filePath);
        }
        return res.status(400).json({ error: 'Phone number already registered.Please Login to your Account' });
      }
      if (existingFarmer.email === email) {
        console.log('Duplicate email found');
        if (filePath && fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
            else console.log('Duplicate file deleted:', filePath);
          });
        } else {
          console.log('File not found at:', filePath);
        }
        return res.status(400).json({ error: 'Email already registered.Please Login to your Account' });
      }
    }

    const saltRounds = 10;
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create new farmer document
    const newFarmer = new Farmer({
      fullName,
      phoneNumber,
      email: email || null,
      password: hashedPassword,
      state: inputState,
      district: inputDistrict,
      villageTown: village_town,
      pinCode,
      profilePicture
    });
    
    console.log('Creating new farmer with data:', {
      fullName, phoneNumber, email: email || null, inputState, inputDistrict, village_town, pinCode, profilePicture
    });
    
    const savedFarmer = await newFarmer.save();
    console.log('Farmer saved successfully:', savedFarmer._id);

    console.log('Farmer registered successfully');
    res.status(200).json({ message: 'Farmer registered successfully!' });
  } catch (error) {
    console.error('Error in /register endpoint:', error);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
        else console.log('Error file deleted:', filePath);
      });
    } else {
      console.log('File not found at:', filePath);
    }
    if (error.code === 11000) { // MongoDB duplicate key error
      console.log('Duplicate entry error detected');
      return res.status(400).json({ error: 'Duplicate entry detected' });
    }
    res.status(500).json({ error: 'An error occurred while registering. Please try again.' });
  }
});

module.exports = router;