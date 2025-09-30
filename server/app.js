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
const marketPricesRoutes = require('./routes/market-prices');
const chatRoutes = require('./routes/chats');
const http = require('http');
const socketIo = require('socket.io');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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
app.use('/api/market-prices', marketPricesRoutes);
app.use('/api/chats', chatRoutes);

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

// Serve Market Prices Page
app.get('/market-prices', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'market-prices.html'));
});

// Serve Chats Page
app.get('/chats', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'chats.html'));
});

// Serve Chat Test Page
app.get('/chat-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'chat-test.html'));
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

// Serve Admin Help Page
app.get('/admin-help', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'admin-help.html'));
});

// Serve Admin Test Page
app.get('/admin-test', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-test.html'));
});

// Serve Test Help Submit Page
app.get('/test-help-submit', (req, res) => {
  res.sendFile(path.join(__dirname, '../test-help-submit.html'));
});

// Serve Admin Registration Page
app.get('/admin-register', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-register.html'));
});

// Serve Admin Diagnostics Page
app.get('/admin-diagnostics', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-diagnostics.html'));
});

// Temporary test route to check tickets (remove in production)
app.get('/test-tickets', async (req, res) => {
  try {
    const Ticket = require('./models/Ticket');
    const tickets = await Ticket.find({}).sort({ createdAt: -1 }).limit(10);
    res.json({
      success: true,
      count: tickets.length,
      tickets: tickets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Temporary test route to create sample tickets (remove in production)
app.get('/create-test-tickets', async (req, res) => {
  try {
    const Ticket = require('./models/Ticket');
    
    // Create some sample tickets
    const sampleTickets = [
      {
        ticketId: 'KC-' + Date.now() + '-001',
        name: 'Ravi Kumar',
        email: 'ravi.kumar@example.com',
        phone: '9876543210',
        category: 'crop_disease',
        priority: 'high',
        message: 'My tomato plants are wilting and leaves are turning brown. Need urgent help!',
        cropType: 'Tomato',
        status: 'open'
      },
      {
        ticketId: 'KC-' + Date.now() + '-002',
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '8765432109',
        category: 'market_price',
        priority: 'medium',
        message: 'Need current market rates for onions. When is the best time to sell?',
        cropType: 'Onion',
        status: 'in_progress'
      },
      {
        ticketId: 'KC-' + Date.now() + '-003',
        name: 'Suresh Patel',
        email: 'suresh.patel@example.com',
        phone: '7654321098',
        category: 'equipment',
        priority: 'low',
        message: 'Tractor making unusual noise during startup. Need maintenance tips.',
        cropType: 'Multiple',
        status: 'resolved'
      }
    ];
    
    const createdTickets = await Ticket.insertMany(sampleTickets);
    
    res.json({
      success: true,
      message: 'Sample tickets created successfully',
      count: createdTickets.length,
      tickets: createdTickets
    });
  } catch (error) {
    console.error('Error creating test tickets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
app.get('/api/admin/help-queries', async (req, res) => {
  // Temporary: Allow testing without auth (remove in production)
  console.log('🔍 Admin help queries request received');
  console.log('Session:', req.session);
  
  // Check admin access (temporarily commented for testing)
  /*
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  const adminEmails = ['admin@kisaanconnect.com', 'support@kisaanconnect.com', 'thanushreddy934@gmail.com'];
  if (!adminEmails.includes(req.session.user.email)) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  */
  
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

app.put('/api/admin/help-queries/:id', async (req, res) => {
  // Temporary: Allow testing without auth (remove in production)
  console.log('🔍 Admin help query update request received');
  console.log('Session:', req.session);
  
  // Check admin access (temporarily commented for testing)
  /*
  if (!req.session.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  const adminEmails = ['admin@kisaanconnect.com', 'support@kisaanconnect.com', 'thanushreddy934@gmail.com'];
  if (!adminEmails.includes(req.session.user.email)) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  */
  
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

// Market Prices API Endpoints
app.get('/api/market-prices', (req, res) => {
  try {
    // Sample market price data - in production, this would come from a real market data API
    const marketPrices = [
      {
        id: 1,
        name: "Tomato",
        category: "vegetable",
        icon: "🍅",
        currentPrice: Math.floor(Math.random() * 20) + 35, // Dynamic pricing
        unit: "per kg",
        change: (Math.random() - 0.5) * 10,
        location: "Delhi",
        market: "Azadpur Mandi",
        quality: "Grade A",
        history: generatePriceHistory(40, 7),
        avgPrice: 42,
        lastUpdated: new Date()
      },
      {
        id: 2,
        name: "Onion",
        category: "vegetable",
        icon: "🧅",
        currentPrice: Math.floor(Math.random() * 15) + 20,
        unit: "per kg",
        change: (Math.random() - 0.5) * 8,
        location: "Mumbai",
        market: "Vashi Market",
        quality: "Grade B",
        history: generatePriceHistory(28, 7),
        avgPrice: 29,
        lastUpdated: new Date()
      },
      {
        id: 3,
        name: "Apple",
        category: "fruit",
        icon: "🍎",
        currentPrice: Math.floor(Math.random() * 40) + 160,
        unit: "per kg",
        change: (Math.random() - 0.5) * 6,
        location: "Bangalore",
        market: "KR Market",
        quality: "Premium",
        history: generatePriceHistory(180, 7),
        avgPrice: 179,
        lastUpdated: new Date()
      },
      {
        id: 4,
        name: "Banana",
        category: "fruit",
        icon: "🍌",
        currentPrice: Math.floor(Math.random() * 20) + 55,
        unit: "per dozen",
        change: (Math.random() - 0.5) * 4,
        location: "Chennai",
        market: "Koyambedu Market",
        quality: "Grade A",
        history: generatePriceHistory(65, 7),
        avgPrice: 65,
        lastUpdated: new Date()
      },
      {
        id: 5,
        name: "Rice",
        category: "grain",
        icon: "🌾",
        currentPrice: Math.floor(Math.random() * 10) + 50,
        unit: "per kg",
        change: (Math.random() - 0.5) * 5,
        location: "Hyderabad",
        market: "Begum Bazaar",
        quality: "Basmati",
        history: generatePriceHistory(55, 7),
        avgPrice: 54,
        lastUpdated: new Date()
      },
      {
        id: 6,
        name: "Wheat",
        category: "grain",
        icon: "🌾",
        currentPrice: Math.floor(Math.random() * 8) + 28,
        unit: "per kg",
        change: (Math.random() - 0.5) * 3,
        location: "Delhi",
        market: "Azadpur Mandi",
        quality: "Grade A",
        history: generatePriceHistory(32, 7),
        avgPrice: 32.5,
        lastUpdated: new Date()
      },
      {
        id: 7,
        name: "Turmeric",
        category: "spice",
        icon: "🟡",
        currentPrice: Math.floor(Math.random() * 30) + 110,
        unit: "per kg",
        change: (Math.random() - 0.5) * 12,
        location: "Bangalore",
        market: "Spice Market",
        quality: "Premium",
        history: generatePriceHistory(120, 7),
        avgPrice: 116,
        lastUpdated: new Date()
      },
      {
        id: 8,
        name: "Chili",
        category: "spice",
        icon: "🌶️",
        currentPrice: Math.floor(Math.random() * 20) + 75,
        unit: "per kg",
        change: (Math.random() - 0.5) * 8,
        location: "Mumbai",
        market: "Crawford Market",
        quality: "Grade B",
        history: generatePriceHistory(85, 7),
        avgPrice: 87,
        lastUpdated: new Date()
      },
      {
        id: 9,
        name: "Potato",
        category: "vegetable",
        icon: "🥔",
        currentPrice: Math.floor(Math.random() * 10) + 20,
        unit: "per kg",
        change: (Math.random() - 0.5) * 4,
        location: "Kolkata",
        market: "Sealdah Market",
        quality: "Grade A",
        history: generatePriceHistory(25, 7),
        avgPrice: 24.5,
        lastUpdated: new Date()
      },
      {
        id: 10,
        name: "Mango",
        category: "fruit",
        icon: "🥭",
        currentPrice: Math.floor(Math.random() * 40) + 130,
        unit: "per kg",
        change: (Math.random() - 0.5) * 15,
        location: "Hyderabad",
        market: "Fruit Market",
        quality: "Alphonso",
        history: generatePriceHistory(150, 7),
        avgPrice: 143,
        lastUpdated: new Date()
      },
      // Additional items
      {
        id: 11,
        name: "Carrot",
        category: "vegetable",
        icon: "🥕",
        currentPrice: Math.floor(Math.random() * 15) + 25,
        unit: "per kg",
        change: (Math.random() - 0.5) * 6,
        location: "Delhi",
        market: "Azadpur Mandi",
        quality: "Grade A",
        history: generatePriceHistory(30, 7),
        avgPrice: 32,
        lastUpdated: new Date()
      },
      {
        id: 12,
        name: "Orange",
        category: "fruit",
        icon: "🍊",
        currentPrice: Math.floor(Math.random() * 30) + 70,
        unit: "per kg",
        change: (Math.random() - 0.5) * 8,
        location: "Mumbai",
        market: "Crawford Market",
        quality: "Premium",
        history: generatePriceHistory(85, 7),
        avgPrice: 88,
        lastUpdated: new Date()
      }
    ];

    // Calculate change percentages
    marketPrices.forEach(item => {
      item.change = parseFloat(((item.currentPrice - item.avgPrice) / item.avgPrice * 100).toFixed(1));
    });

    res.json({
      success: true,
      data: marketPrices,
      lastUpdated: new Date(),
      message: 'Market prices retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market prices'
    });
  }
});

// Helper function to generate price history
function generatePriceHistory(basePrice, days) {
  const history = [];
  let price = basePrice;
  
  for (let i = 0; i < days; i++) {
    // Add some randomness to simulate price fluctuations
    const change = (Math.random() - 0.5) * 6; // ±3% change
    price = Math.max(basePrice * 0.8, Math.min(basePrice * 1.2, price + change));
    history.push(Math.floor(price));
  }
  
  return history;
}

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

// Socket.IO for real-time chat
const connectedUsers = new Map(); // Store user socket connections

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join-user', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} joined their room`);
  });

  // Join a chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  // Leave a chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`Socket ${socket.id} left chat ${chatId}`);
  });

  // Handle new message
  socket.on('send-message', async (data) => {
    try {
      const { chatId, content, messageType = 'text' } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Verify user is participant in this chat
      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Create message
      const message = new Message({
        chatId,
        sender: socket.userId,
        content: content.trim(),
        type: messageType
      });

      await message.save();
      await message.populate('sender', 'fullName profilePicture');

      // Update chat's last message and unread counts
      const otherParticipantId = chat.participants.find(id => !id.equals(socket.userId));
      
      await Chat.findByIdAndUpdate(chatId, {
        $set: {
          'lastMessage.content': content.trim(),
          'lastMessage.sender': socket.userId,
          'lastMessage.timestamp': new Date()
        }
      });

      // Update unread count for other participant
      await Chat.findByIdAndUpdate(chatId, {
        $inc: {
          'unreadCount.$[elem].count': 1
        }
      }, {
        arrayFilters: [{ 'elem.userId': otherParticipantId }]
      });

      const formattedMessage = {
        messageId: message._id,
        content: message.content,
        sender: {
          id: message.sender._id,
          name: message.sender.fullName,
          profilePicture: message.sender.profilePicture
        },
        messageType: message.messageType,
        isOwn: message.sender._id.equals(socket.userId),
        isRead: false,
        timestamp: message.createdAt,
        chatId: chatId
      };

      // Emit to all participants in the chat
      io.to(`chat_${chatId}`).emit('new-message', formattedMessage);
      
      // Emit to other participant's personal room for notifications
      io.to(`user_${otherParticipantId}`).emit('chat-notification', {
        chatId,
        message: formattedMessage,
        from: {
          id: message.sender._id,
          name: message.sender.fullName
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { chatId, userName } = data;
    socket.to(`chat_${chatId}`).emit('user-typing', { userName, userId: socket.userId });
  });

  socket.on('typing-stop', (data) => {
    const { chatId } = data;
    socket.to(`chat_${chatId}`).emit('user-stop-typing', { userId: socket.userId });
  });

  // Handle message read receipts
  socket.on('mark-messages-read', async (data) => {
    try {
      const { chatId } = data;
      
      // Mark messages as read
      await Message.updateMany(
        { chatId, sender: { $ne: socket.userId }, isRead: false },
        { 
          $set: { isRead: true }, 
          $push: { readBy: { userId: socket.userId } } 
        }
      );

      // Update unread count
      await Chat.findByIdAndUpdate(chatId, {
        $set: {
          'unreadCount.$[elem].count': 0
        }
      }, {
        arrayFilters: [{ 'elem.userId': socket.userId }]
      });

      // Notify other participants
      socket.to(`chat_${chatId}`).emit('messages-read', { userId: socket.userId, chatId });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
    }
  });
});

// Start Server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});