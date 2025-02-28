// utils/mediaHelpers.js
const fs = require('fs');
const path = require('path');

/**
 * Validates a media file for existence, format, and size
 * @param {string} filePath - Full path to the media file
 * @param {string[]} allowedExtensions - Array of allowed file extensions (without dots)
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {Object} Result object with validation status and details
 */
const validateMedia = (filePath, allowedExtensions = ['mp4', 'mov'], maxSizeMB = 100) => {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return {
      isValid: false,
      status: 404,
      error: "Media file not found",
      details: `File does not exist at path: ${filePath}`
    };
  }

  // Check file extension
  const extension = path.extname(filePath).toLowerCase().substring(1);
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      status: 400,
      error: "Invalid file format",
      details: `File must be one of the following formats: ${allowedExtensions.join(', ')}`
    };
  }

  // Check file size
  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return {
      isValid: false,
      status: 400,
      error: "File too large",
      details: `File size exceeds the maximum allowed size of ${maxSizeMB}MB. Current size: ${fileSizeMB.toFixed(2)}MB`
    };
  }

  // All checks passed
  return {
    isValid: true,
    fileSizeMB: fileSizeMB.toFixed(2),
    extension
  };
};

module.exports = {
  validateMedia
};