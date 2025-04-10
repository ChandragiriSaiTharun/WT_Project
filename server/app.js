require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
const forgotPasswordRoutes = require('./routes/forgot-password');
const cropRoutes = require('./routes/crops');
const app = express();

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

// Serve Landing Page (index.html) at Root
app.get('/', (req, res) => {
  console.log('Serving index.html');
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

// Serve Marketplace (HomePage_DetailsFilling.html)
app.get('/marketplace', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'HomePage_DetailsFilling.html'));
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
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});