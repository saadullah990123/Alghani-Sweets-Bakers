import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'alghani_super_secure_session_key_2026_fallback_99';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(adminId: string, email: string): string {
  const payload = JSON.stringify({
    adminId,
    email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  const base64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Payload)
    .digest('base64url');
    
  return `${base64Payload}.${signature}`;
}

export function verifySessionToken(token: string): { adminId: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [base64Payload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(base64Payload)
      .digest('base64url');
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    
    return { adminId: payload.adminId, email: payload.email };
  } catch (err) {
    return null;
  }
}
