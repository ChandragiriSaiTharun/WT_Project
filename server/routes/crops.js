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

// GET /crops - Retrieve all crops with pagination and filtering
router.get('/', async (req, res) => {
  console.log('Received GET /crops request');
  console.log('Query parameters:', req.query);

  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'addedDate', 
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      location,
      cropType
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { seller: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (cropType) {
      filter.name = { $regex: cropType, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const crops = await Crop.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await Crop.countDocuments(filter);

    console.log(`Fetched ${crops.length} crops out of ${total} total`);

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
      imageUrl: crop.image ? `/crop/${crop.image}` : null,
      createdAt: crop.createdAt,
      updatedAt: crop.updatedAt
    }));

    res.status(200).json({
      crops: cropsWithImageUrl,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filters: {
        search,
        sortBy,
        sortOrder,
        minPrice,
        maxPrice,
        location,
        cropType
      }
    });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ error: 'Failed to fetch crops', details: error.message });
  }
});

// GET /crops/:id - Get single crop by ID
router.get('/:id', async (req, res) => {
  console.log('Received GET /crops/:id request for ID:', req.params.id);

  try {
    const crop = await Crop.findById(req.params.id);
    
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const cropWithImageUrl = {
      id: crop._id,
      name: crop.name,
      image: crop.image,
      price: crop.price,
      quantity: crop.quantity,
      unit: crop.unit,
      seller: crop.seller,
      location: crop.location,
      added_date: crop.addedDate,
      imageUrl: crop.image ? `/crop/${crop.image}` : null,
      createdAt: crop.createdAt,
      updatedAt: crop.updatedAt
    };

    res.status(200).json(cropWithImageUrl);
  } catch (error) {
    console.error('Error fetching crop:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid crop ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch crop', details: error.message });
  }
});

// PUT /crops/:id - Update crop (only by owner or admin)
router.put('/:id', isAuthenticated, upload.single('cropImage'), async (req, res) => {
  console.log('Received PUT /crops/:id request for ID:', req.params.id);
  console.log('Request body:', req.body);

  try {
    const crop = await Crop.findById(req.params.id);
    
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    const { cropName, cropUnit, cropQuantity, cropPrice, sellerName, location } = req.body;
    
    // Build update object
    const updateData = {};
    if (cropName) updateData.name = cropName;
    if (cropUnit) updateData.unit = cropUnit;
    if (cropQuantity) updateData.quantity = cropQuantity;
    if (cropPrice) updateData.price = cropPrice;
    if (sellerName) updateData.seller = sellerName;
    if (location) updateData.location = location;
    
    // Handle new image upload
    if (req.file) {
      // Delete old image if exists
      if (crop.image) {
        const oldImagePath = path.join(__dirname, '../../uploads/crop', crop.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = req.file.filename;
    }

    const updatedCrop = await Crop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Crop updated successfully:', updatedCrop._id);
    res.status(200).json({ 
      message: 'Crop updated successfully!', 
      crop: {
        id: updatedCrop._id,
        name: updatedCrop.name,
        image: updatedCrop.image,
        price: updatedCrop.price,
        quantity: updatedCrop.quantity,
        unit: updatedCrop.unit,
        seller: updatedCrop.seller,
        location: updatedCrop.location,
        imageUrl: updatedCrop.image ? `/crop/${updatedCrop.image}` : null
      }
    });
  } catch (error) {
    console.error('Error updating crop:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to update crop', details: error.message });
  }
});

// DELETE /crops/:id - Delete crop (only by owner or admin)
router.delete('/:id', isAuthenticated, async (req, res) => {
  console.log('Received DELETE /crops/:id request for ID:', req.params.id);

  try {
    const crop = await Crop.findById(req.params.id);
    
    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    // Delete associated image file
    if (crop.image) {
      const imagePath = path.join(__dirname, '../../uploads/crop', crop.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('Deleted image file:', imagePath);
      }
    }

    await Crop.findByIdAndDelete(req.params.id);
    
    console.log('Crop deleted successfully:', req.params.id);
    res.status(200).json({ message: 'Crop deleted successfully!' });
  } catch (error) {
    console.error('Error deleting crop:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid crop ID format' });
    }
    res.status(500).json({ error: 'Failed to delete crop', details: error.message });
  }
});

// GET /crops/search/suggestions - Get crop name suggestions for autocomplete
router.get('/search/suggestions', async (req, res) => {
  console.log('Received GET /crops/search/suggestions request');
  
  try {
    const { q = '' } = req.query;
    
    if (q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await Crop.distinct('name', {
      name: { $regex: q, $options: 'i' }
    });

    res.json({ suggestions: suggestions.slice(0, 10) });
  } catch (error) {
    console.error('Error getting crop suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

module.exports = router;