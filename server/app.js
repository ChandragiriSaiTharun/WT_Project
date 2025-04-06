require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
const forgotPasswordRoutes = require('./routes/forgot-password'); // Add this line
const app = express();
  
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

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
app.use('/forgot-password', forgotPasswordRoutes); // Add this line to mount forgot-password routes at root level

// Serve Landing Page (index.html) at Root
app.get('/', (req, res) => {
  console.log('Serving index.html');
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
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

// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// Serve User Data
app.get('/user', isAuthenticated, (req, res) => {
  res.json(req.session.user);
});

// Serve Dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'dashboard.html'));
});

// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});