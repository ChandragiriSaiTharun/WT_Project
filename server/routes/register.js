const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
const db = require('../config/db');
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
    const checkQuery = `
      SELECT * FROM farmers WHERE phone_number = ? OR (email IS NOT NULL AND email = ?)
    `;
    console.log('Executing duplicate check query with:', phoneNumber, email);
    const [existing] = await db.promise().query(checkQuery, [phoneNumber, email || '']);
    console.log('Duplicate check result:', existing);

    if (existing.length > 0) {
      if (existing[0].phone_number === phoneNumber) {
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
      if (existing[0].email === email) {
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

    const insertQuery = `
      INSERT INTO farmers (full_name, phone_number, email, password, state, district, village_town, pin_code, profile_picture)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    console.log('Executing insert query with:', [
      fullName, phoneNumber, email || null, hashedPassword, inputState, inputDistrict, village_town, pinCode, profilePicture
    ]);
    const [result] = await db.promise().query(insertQuery, [
      fullName, phoneNumber, email || null, hashedPassword, inputState, inputDistrict, village_town, pinCode, profilePicture
    ]);
    console.log('Insert result:', result);

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
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('Duplicate entry error detected');
      return res.status(400).json({ error: 'Duplicate entry detected' });
    }
    res.status(500).json({ error: 'An error occurred while registering. Please try again.' });
  }
});

module.exports = router;