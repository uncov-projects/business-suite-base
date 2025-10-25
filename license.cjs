// license.js

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { app } = require("electron");
const { machineIdSync } = require("node-machine-id");

const LICENSE_FILE = path.join(app.getPath("userData"), "license.json");
const SECRET_KEY = "7d4f2a98c2b84f6ebd92164f3f84acb1"; // Replace with a secure, private key

// Get a unique hardware identifier for the current machine
function getMachineId() {
  return machineIdSync(); // You can pass {original: true} if you want a raw ID
}

// Generate a license key by hashing the machine ID with a secret key
function generateLicenseKey(machineId) {
  return crypto.createHmac("sha256", SECRET_KEY).update(machineId).digest("hex");
}

// Check if a license file already exists
function isLicenseFilePresent() {
  return fs.existsSync(LICENSE_FILE);
}

// Read the stored license key from disk
function readStoredLicenseKey() {
  try {
    if (!fs.existsSync(LICENSE_FILE)) {
      return null; // File doesn't exist, return null
    }
    const data = fs.readFileSync(LICENSE_FILE, "utf-8");
    const { key } = JSON.parse(data);
    return key;
  } catch (err) {
    console.error("Failed to read license file:", err);
    return null;
  }
}

// Write a license key to disk
function writeLicenseKeyToFile(key) {
  try {
    fs.writeFileSync(LICENSE_FILE, JSON.stringify({ key }), { encoding: "utf-8" });
    console.log("License saved to:", LICENSE_FILE);
    return true;
  } catch (err) {
    console.error("Failed to write license file:", err);
    return false;
  }
}

// Validate if the input license key matches the machine's expected key
function validateLicenseKey(inputKey) {
  const machineId = getMachineId();
  const expectedKey = generateLicenseKey(machineId);
  return inputKey === expectedKey;
}

// Save a valid license key to file
function checkAndSaveLicense(inputKey) {
  if (validateLicenseKey(inputKey)) {
    return writeLicenseKeyToFile(inputKey);
  }
  return false;
}

// Verify the stored license is valid for this machine
function verifyStoredLicense() {
  const storedKey = readStoredLicenseKey();
  if (!storedKey) return false;
  return validateLicenseKey(storedKey);
}

module.exports = {
  generateLicenseKey,
  validateLicenseKey,
  checkAndSaveLicense,
  verifyStoredLicense,
};
