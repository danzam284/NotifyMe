export async function createNotification(text: string) {
  const cleanedText = text.trim();

  return {
    message: "Notify request received",
    text: cleanedText,
  };
}