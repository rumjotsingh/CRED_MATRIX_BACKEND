import crypto from 'crypto';
import fs from 'fs';

/**
 * Generate SHA256 hash for file verification
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - SHA256 hash
 */
const generateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (error) => reject(error));
  });
};

/**
 * Verify file hash
 * @param {string} filePath - Path to the file
 * @param {string} expectedHash - Expected hash value
 * @returns {Promise<boolean>} - True if hash matches
 */
const verifyFileHash = async (filePath, expectedHash) => {
  const actualHash = await generateFileHash(filePath);
  return actualHash === expectedHash;
};

export { generateFileHash, verifyFileHash };
