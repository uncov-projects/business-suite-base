import { showDialog } from "./dialog"; // assuming your existing showDialog is here

export const showSuccessDialog = async ({ title, message }) => {
  return await showDialog({
    title,
    message,
    type: "info",
    buttons: ["OK"],
  });
};

export const showErrorDialog = async ({ title, message }) => {
  return await showDialog({
    title,
    message,
    type: "error",
    buttons: ["OK"],
  });
};

export const showWarningDialog = async ({ title, message }) => {
  return await showDialog({
    title,
    message,
    type: "warning",
    buttons: ["OK"],
  });
};

export const showConfirmDialog = async ({ title, message }) => {
  const result = await window.electron.showNativeMessageBox({
    type: "question",
    title,
    message,
    buttons: ["Cancel", "Continue"],
    defaultId: 1, // 'Continue' selected by default
    cancelId: 0,
  });
  return result.response === 1; // returns true if 'Continue' clicked
};
