import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

const defaultSecret = 'davinci_gold_secret_key_2026_exclusive';

function getSecret() {
  return process.env.FEEDBACK_TOKEN_SECRET || process.env.JWT_SECRET || defaultSecret;
}

function signPayload(appointmentId: string, expiresAt: number) {
  return createHmac('sha256', getSecret())
    .update(`${appointmentId}.${expiresAt}`)
    .digest('base64url');
}

export function createFeedbackToken(appointmentId: string, ttlMs = 7 * 24 * 60 * 60 * 1000) {
  const expiresAt = Date.now() + ttlMs;
  const signature = signPayload(appointmentId, expiresAt);
  return `${appointmentId}.${expiresAt}.${signature}`;
}

export function verifyFeedbackToken(token: string, appointmentId: string) {
  if (!token) {
    throw new UnauthorizedException('Token de feedback ausente.');
  }

  const [tokenAppointmentId, rawExpiresAt, signature] = token.split('.');
  const expiresAt = Number(rawExpiresAt);
  if (!tokenAppointmentId || !signature || !Number.isFinite(expiresAt)) {
    throw new BadRequestException('Token de feedback inválido.');
  }
  if (tokenAppointmentId !== appointmentId) {
    throw new UnauthorizedException('Token de feedback não corresponde ao agendamento.');
  }
  if (expiresAt < Date.now()) {
    throw new UnauthorizedException('Token de feedback expirado.');
  }

  const expected = signPayload(appointmentId, expiresAt);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    throw new UnauthorizedException('Token de feedback inválido.');
  }
}
