// Database migration script to fix crop image filenames
// This script fixes the double timestamp issue in the crop.image field

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import the Crop model
const Crop = require('./server/models/Crop');

async function fixCropImageFilenames() {
  try {
    console.log('🔍 Starting crop image filename fix...');
    console.log('🔍 Connecting to MongoDB...');

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Finding crops with image filenames...');
    const crops = await Crop.find({ image: { $exists: true, $ne: null, $ne: '' } });
    console.log(`📊 Found ${crops.length} crops with images`);

    const uploadsDir = path.join(__dirname, 'uploads/crop');
    const existingFiles = fs.readdirSync(uploadsDir);
    console.log(`📁 Found ${existingFiles.length} files in uploads directory`);

    let fixedCount = 0;
    let notFoundCount = 0;

    for (const crop of crops) {
      const currentImageName = crop.image;
      console.log(`\n🔍 Processing crop: ${crop.name}`);
      console.log(`   Current image name: ${currentImageName}`);

      // Check if current image file exists
      const currentFilePath = path.join(uploadsDir, currentImageName);
      if (fs.existsSync(currentFilePath)) {
        console.log(`   ✅ File exists: ${currentImageName}`);
        continue; // No need to fix
      }

      // Extract the original filename pattern
      const timestampPattern = /^\d+-(.+)$/;
      const match = currentImageName.match(timestampPattern);

      if (match) {
        const originalPart = match[1]; // Get the part after the first timestamp
        console.log(`   🔧 Original part: ${originalPart}`);

        // Look for a file that ends with this original part
        const matchingFile = existingFiles.find(file => file.endsWith(originalPart));

        if (matchingFile) {
          console.log(`   ✅ Found matching file: ${matchingFile}`);

          // Update the crop record
          await Crop.findByIdAndUpdate(crop._id, { image: matchingFile });
          console.log(`   ✅ Updated crop ${crop.name} image to: ${matchingFile}`);
          fixedCount++;
        } else {
          console.log(`   ❌ No matching file found for: ${originalPart}`);
          notFoundCount++;
        }
      } else {
        console.log(`   ⚠️  Filename doesn't match timestamp pattern: ${currentImageName}`);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount} crops`);
    console.log(`   ❌ Not found: ${notFoundCount} crops`);
    console.log(`   📋 Total processed: ${crops.length} crops`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  fixCropImageFilenames();
}

module.exports = fixCropImageFilenames;
