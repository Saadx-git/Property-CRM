import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { session: null, error: errorResponse('Unauthorized', 401) };
  }
  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireAuth();
  if (error) return { session: null, error };
  const user = session!.user as { role: string };
  if (user.role !== 'admin') {
    return { session: null, error: errorResponse('Admin access required', 403) };
  }
  return { session, error: null };
}

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
