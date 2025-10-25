console.log("✅ Preload script loaded");
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    submitLicense: (key) => ipcRenderer.send("submit-license", key),
    onInvalidLicense: (callback) => ipcRenderer.on("license-invalid", callback),
});