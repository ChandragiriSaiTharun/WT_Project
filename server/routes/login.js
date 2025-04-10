const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');

router.post('/', (req, res) => {
  console.log('Received POST /login request');
  console.log('Raw headers:', req.headers);
  console.log('Raw body:', req.body);

  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { emailPhone, password } = req.body;

  if (!emailPhone || !password) {
    return res.status(400).json({ error: 'Email/phone and password are required' });
  }

  db.query(
    'SELECT * FROM farmers WHERE email = ? OR phone_number = ?',
    [emailPhone, emailPhone],
    (err, users) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (users.length === 0) {
        console.log('No user found');
        return res.status(401).json({ error: 'Invalid email/phone or password' });
      }

      const user = users[0];
      console.log('User found from DB:', user); // Log full user object

      bcrypt.compare(password, user.password, (err, passwordMatch) => {
        if (err) {
          console.error('Password comparison error:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        if (!passwordMatch) {
          console.log('Password mismatch');
          return res.status(401).json({ error: 'Invalid email/phone or password' });
        }

        req.session.user = {
          id: user.id,
          fullName: user.full_name,
          phoneNumber: user.phone_number,
          email: user.email,
          profilePicture: user.profile_picture
        };
        console.log('Session created:', req.session.user); // Log session data

        console.log('Login successful for user:', user.full_name);
        res.status(200).json({ message: 'Login successful!' });
      });
    }
  );
});

module.exports = router;