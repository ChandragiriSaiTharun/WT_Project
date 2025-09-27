require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
const forgotPasswordRoutes = require('./routes/forgot-password');
const cropRoutes = require('./routes/crops');
const helpRoutes = require('./routes/help');
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));
app.use('/profile', express.static(path.join(__dirname, '../uploads/profile')));
app.use('/crop', express.static(path.join(__dirname, '../uploads/crop')));

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/register', registerRoutes);
app.use('/login', loginRoutes);
app.use('/forgot-password', forgotPasswordRoutes);
app.use('/crops', cropRoutes);
app.use('/api/help', helpRoutes);

// Serve Landing Page (index.html) at Root
app.get('/', (req, res) => {
  console.log('Serving index.html');
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// Serve Marketplace (HomePage_DetailsFilling.html)
app.get('/marketplace', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'HomePage_DetailsFilling.html'));
});

// Serve Email Test Page
app.get('/email-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'email-test.html'));
});

// Serve Database Test Page
app.get('/db-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'db-test.html'));
});

// Serve Crops Test Page
app.get('/crops-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'crops-test.html'));
});

// Test endpoint to check crops in database
app.get('/api/test/crops', async (req, res) => {
  try {
    const Crop = require('./models/Crop');
    const crops = await Crop.find({}).limit(20).sort({ addedDate: -1 });
    const count = await Crop.countDocuments();
    
    res.json({
      message: 'Crops database test successful',
      totalCrops: count,
      crops: crops.map(crop => ({
        id: crop._id,
        name: crop.name,
        image: crop.image,
        price: crop.price,
        quantity: crop.quantity,
        unit: crop.unit,
        seller: crop.seller,
        location: crop.location,
        addedDate: crop.addedDate,
        imageUrl: crop.image ? `/crop/${crop.image}` : null,
        createdAt: crop.createdAt
      }))
    });
  } catch (error) {
    console.error('Crops test error:', error);
    res.status(500).json({ 
      error: 'Crops test failed', 
      details: error.message 
    });
  }
});

// Serve Admin Test Page
app.get('/admin-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'admin-test.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'about.html'));
});

app.get('/weather', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'weather.html'));
});

app.get('/schemes', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'schemes.html'));
});

app.get('/equipment', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'equipment.html'));
});

app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'help.html'));
});

// Logout Endpoint
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    console.log('User logged out successfully');
    res.redirect('/');
  });
});

// Serve User Data
app.get('/user', (req, res) => {
  if (req.session.user) {
    // Add admin flag for specific email
    const userData = {
      ...req.session.user,
      isAdmin: req.session.user.email === 'thanushreddy934@gmail.com'
    };
    res.json(userData);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Check if user is admin
app.get('/api/user/admin-check', (req, res) => {
  if (req.session.user && req.session.user.email === 'thanushreddy934@gmail.com') {
    res.json({ isAdmin: true, email: req.session.user.email });
  } else {
    res.json({ isAdmin: false });
  }
});

// ===== API ENDPOINTS FOR DATA FETCHING =====

// Test endpoint to check database and farmers
app.get('/api/test/farmers', async (req, res) => {
  try {
    const Farmer = require('./models/Farmer');
    const farmers = await Farmer.find({}).limit(10);
    const count = await Farmer.countDocuments();
    
    res.json({
      message: 'Database connection test successful',
      totalFarmers: count,
      farmers: farmers.map(f => ({
        id: f._id,
        fullName: f.fullName,
        phoneNumber: f.phoneNumber,
        email: f.email,
        state: f.state,
        district: f.district,
        createdAt: f.createdAt
      }))
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      error: 'Database test failed', 
      details: error.message 
    });
  }
});

// Admin Help Queries Endpoints
app.get('/help', async (req, res) => {
  try {
    const Ticket = require('./models/Ticket');
    const tickets = await Ticket.find({}).sort({ createdAt: -1 });
    
    // Transform tickets to match the expected format
    const queries = tickets.map(ticket => ({
      _id: ticket._id,
      farmerName: ticket.name,
      cropType: ticket.cropType || 'General',
      message: ticket.message,
      status: ticket.status === 'open' ? 'pending' : ticket.status === 'in_progress' ? 'in-progress' : 'resolved',
      contactInfo: {
        email: ticket.email,
        phone: null // Add phone if available in your ticket model
      },
      response: ticket.responses && ticket.responses.length > 0 ? ticket.responses[ticket.responses.length - 1].message : null,
      createdAt: ticket.createdAt
    }));
    
    res.json({
      success: true,
      queries: queries
    });
  } catch (error) {
    console.error('Error fetching help queries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch help queries'
    });
  }
});

app.put('/help/:id', async (req, res) => {
  try {
    const Ticket = require('./models/Ticket');
    const { id } = req.params;
    const { status, response } = req.body;
    
    const updateData = {};
    
    // Handle status update
    if (status) {
      // Transform status from frontend format to backend format
      switch(status) {
        case 'pending':
          updateData.status = 'open';
          break;
        case 'in-progress':
          updateData.status = 'in_progress';
          break;
        case 'resolved':
          updateData.status = 'resolved';
          break;
        default:
          updateData.status = status;
      }
    }
    
    // Handle response update
    if (response) {
      updateData.status = 'resolved';
      updateData.$push = {
        responses: {
          message: response,
          respondedBy: 'admin',
          respondedByName: 'Admin',
          respondedAt: new Date(),
          type: 'admin'
        }
      };
      updateData.lastResponseAt = new Date();
    }
    
    const updatedTicket = await Ticket.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedTicket) {
      return res.status(404).json({
        success: false,
        error: 'Query not found'
      });
    }
    
    res.json({
      success: true,
      message: response ? 'Response added successfully' : 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating help query:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update help query'
    });
  }
});

// Get all farmers (admin only)
app.get('/api/farmers', async (req, res) => {
  try {
    // Check if user is authenticated and admin
    if (!req.session.user || req.session.user.email !== 'thanushreddy934@gmail.com') {
      return res.status(401).json({ error: 'Admin access required' });
    }

    const Farmer = require('./models/Farmer');
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = search ? {
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const farmers = await Farmer.find(query)
      .select('-password -resetToken -resetTokenExpiry')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Farmer.countDocuments(query);

    res.json({
      farmers,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalFarmers: total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching farmers:', error);
    res.status(500).json({ error: 'Failed to fetch farmers data' });
  }
});

// Get single farmer by ID
app.get('/api/farmers/:id', async (req, res) => {
  try {
    const Farmer = require('./models/Farmer');
    const farmer = await Farmer.findById(req.params.id).select('-password -resetToken -resetTokenExpiry');
    
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    // Check if user can access this data (owner or admin)
    const isAdmin = req.session.user && req.session.user.email === 'thanushreddy934@gmail.com';
    const isOwner = req.session.user && req.session.user.id === farmer._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(farmer);
  } catch (error) {
    console.error('Error fetching farmer:', error);
    res.status(500).json({ error: 'Failed to fetch farmer data' });
  }
});

// Get farmer profile (current user)
app.get('/api/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const Farmer = require('./models/Farmer');
    const farmer = await Farmer.findById(req.session.user.id).select('-password -resetToken -resetTokenExpiry');
    
    if (!farmer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(farmer);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile data' });
  }
});

// Update farmer profile
app.put('/api/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const Farmer = require('./models/Farmer');
    const { fullName, email, state, district, villageTown, pinCode } = req.body;

    const updatedFarmer = await Farmer.findByIdAndUpdate(
      req.session.user.id,
      {
        fullName,
        email,
        state,
        district,
        villageTown,
        pinCode,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password -resetToken -resetTokenExpiry');

    if (!updatedFarmer) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ message: 'Profile updated successfully', farmer: updatedFarmer });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get dashboard stats (admin only)
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.email !== 'thanushreddy934@gmail.com') {
      return res.status(401).json({ error: 'Admin access required' });
    }

    const Farmer = require('./models/Farmer');
    const Crop = require('./models/Crop');

    const [
      totalFarmers,
      totalCrops,
      recentFarmers,
      recentCrops,
      farmersByState
    ] = await Promise.all([
      Farmer.countDocuments(),
      Crop.countDocuments(),
      Farmer.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Crop.countDocuments({ 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Farmer.aggregate([
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      totalFarmers,
      totalCrops,
      recentFarmers,
      recentCrops,
      farmersByState,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});