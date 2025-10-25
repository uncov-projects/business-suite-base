const crypto = require("crypto");
const { machineIdSync } = require("node-machine-id");

const SECRET_KEY = "7d4f2a98c2b84f6ebd92164f3f84acb1";

function generateLicenseKey(machineId) {
    return crypto.createHmac("sha256", SECRET_KEY).update(machineId).digest("hex");
}

const machineId = machineIdSync();
const licenseKey = generateLicenseKey(machineId);

console.log("Machine ID:", machineId);
console.log("Generated License Key:", licenseKey);
