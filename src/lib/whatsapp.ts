// Client-safe WhatsApp utilities (no server dependencies)

export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  // Handle Pakistani numbers: if starts with 0, replace with 92
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.slice(1);
  }
  // If no country code (10 digits for PK), add 92
  if (cleaned.length === 10 && !cleaned.startsWith('92')) {
    cleaned = '92' + cleaned;
  }
  return cleaned;
}

export function getWhatsAppUrl(phone: string): string {
  const formatted = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formatted}`;
}
