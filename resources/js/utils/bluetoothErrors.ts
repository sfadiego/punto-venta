export const isUserCancelledBluetoothError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;
    return error.name === "NotFoundError" || error.message === "User cancelled the requestDevice() chooser.";
};
