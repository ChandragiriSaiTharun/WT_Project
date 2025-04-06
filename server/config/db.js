const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'projectk',
  password: process.env.DB_PASSWORD || 'Kisaan@2025',
  database: process.env.DB_NAME || 'kisaan'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

module.exports = db;