export const showDialog = async ({
  title = "Notification",
  message = "",
  type = "info",
  buttons = ["OK"],
}) => {
  if (window.electron?.showNativeMessageBox) {
    return await window.electron.showNativeMessageBox({
      title,
      message,
      type,
      buttons,
    });
  } else {
    alert(message);
    return { response: 0 };  // emulate OK button index
  }
};