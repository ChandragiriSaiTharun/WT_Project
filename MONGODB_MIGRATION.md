# MongoDB Migration Guide

## Overview

The Kisaan Connect server has been successfully converted from MySQL to MongoDB using Mongoose ODM.

## Changes Made

### 1. Dependencies

- **Removed**: `mysql2`
- **Added**: `mongoose`

### 2. Database Configuration (`server/config/db.js`)

- Replaced MySQL connection with MongoDB connection using Mongoose
- Supports both MongoDB URI and individual connection parameters
- Connection string format: `mongodb://host:port/database`

### 3. Models Created (`server/models/`)

- **Farmer.js**: User/farmer data model with schema validation
- **Crop.js**: Crop data model with schema validation

### 4. Routes Updated

All routes converted from SQL queries to MongoDB operations:

- **register.js**: Uses Mongoose model methods for user registration
- **login.js**: Uses Mongoose findOne for authentication
- **crops.js**: Uses Mongoose for CRUD operations on crops
- **forgot-password.js**: Uses Mongoose for password reset functionality

## Database Schema Mapping

### Farmers Collection (previously `farmers` table)

```javascript
{
  fullName: String(required);
  phoneNumber: String(required, unique);
  email: String(unique, sparse);
  password: String(required, hashed);
  state: String(required);
  district: String(required);
  villageTown: String(required);
  pinCode: String(required);
  profilePicture: String(optional);
  resetToken: String(optional);
  resetTokenExpiry: Date(optional);
  createdAt: Date(auto);
  updatedAt: Date(auto);
}
```

### Crops Collection (previously `crops` table)

```javascript
{
  name: String (required)
  image: String (optional)
  price: Number (required, min: 0)
  quantity: Number (required, min: 0)
  unit: String (required)
  seller: String (required)
  location: String (required)
  addedDate: Date (default: Date.now)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

## Environment Variables

Update your `.env` file with MongoDB configuration:

```env
# Option 1: Full MongoDB URI (recommended)
MONGODB_URI=mongodb://localhost:27017/kisaanconnect

# Option 2: Individual parameters
DB_HOST=localhost
DB_PORT=27017
DB_NAME=kisaanconnect

# Other existing variables remain the same
SESSION_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
PORT=3000
```

## Installation & Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Install MongoDB:

   - **Ubuntu/Debian**: `sudo apt-get install mongodb`
   - **macOS**: `brew install mongodb-community`
   - **Windows**: Download from MongoDB official website

3. Start MongoDB service:

   - **Linux**: `sudo systemctl start mongodb`
   - **macOS**: `brew services start mongodb-community`
   - **Windows**: Start MongoDB service from Services panel

4. Create database (optional - will be created automatically):

   ```bash
   mongo
   use kisaanconnect
   ```

5. Start the server:
   ```bash
   npm start
   ```

## Key Benefits of MongoDB Migration

1. **Flexible Schema**: No need for strict table structures
2. **JSON-like Documents**: Natural fit for Node.js applications
3. **Mongoose ODM**: Built-in validation and schema definition
4. **Better Performance**: For read-heavy applications like marketplace
5. **Scalability**: Easier horizontal scaling
6. **No SQL Injection**: Mongoose provides built-in protection

## Migration Notes

- All existing functionality remains the same
- API endpoints unchanged - full backward compatibility
- File upload functionality preserved
- Session management unchanged
- Authentication flow identical

## Troubleshooting

1. **Connection Issues**:

   - Ensure MongoDB is running
   - Check connection string format
   - Verify database name and credentials

2. **Validation Errors**:

   - Check required fields in models
   - Ensure data types match schema

3. **Performance**:
   - Indexes are automatically created for frequently queried fields
   - Monitor query performance with MongoDB tools

## Future Enhancements

Consider these MongoDB-specific improvements:

- Add compound indexes for complex queries
- Implement data aggregation for analytics
- Use MongoDB Atlas for cloud deployment
- Add data validation at application level
- Implement proper error handling for MongoDB operations
