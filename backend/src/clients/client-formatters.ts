import { BadRequestException } from '@nestjs/common';

function normalizeDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function normalizePhone(telefone: string) {
  const digits = normalizeDigits(telefone || '');

  if (![10, 11].includes(digits.length)) {
    throw new BadRequestException('Telefone inválido. Use o formato (XX) XXXXX-XXXX.');
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
}

export function extractPhoneDigits(telefone: string) {
  return normalizeDigits(telefone || '');
}

export function normalizeBirthday(aniversario?: string | null) {
  if (!aniversario) {
    return null;
  }

  const digits = normalizeDigits(aniversario);
  if (digits.length !== 4) {
    throw new BadRequestException('Data de aniversário inválida. Use o formato DD/MM.');
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));

  if (!Number.isInteger(day) || !Number.isInteger(month) || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new BadRequestException('Data de aniversário inválida. Use o formato DD/MM.');
  }

  const maxDayPerMonth = [31, isLeapYearSafe() ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > maxDayPerMonth[month - 1]) {
    throw new BadRequestException('Data de aniversário inválida. Use o formato DD/MM.');
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

function isLeapYearSafe() {
  const year = new Date().getFullYear();
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function isSamePhoneNumber(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;
  const digitsA = phoneA.replace(/\D/g, '');
  const digitsB = phoneB.replace(/\D/g, '');
  
  // Remove Brazilian country code 55 if present
  const cleanA = digitsA.startsWith('55') && digitsA.length > 11 ? digitsA.substring(2) : digitsA;
  const cleanB = digitsB.startsWith('55') && digitsB.length > 11 ? digitsB.substring(2) : digitsB;
  
  if (cleanA.length < 10 || cleanB.length < 10) {
    // Fallback to simple endsWith if any number is invalid/short
    const last8A = cleanA.substring(Math.max(0, cleanA.length - 8));
    const last8B = cleanB.substring(Math.max(0, cleanB.length - 8));
    return last8A === last8B;
  }
  
  // Extract DDD (first 2 digits of the number without country code)
  const dddA = cleanA.substring(0, 2);
  const dddB = cleanB.substring(0, 2);
  
  // Extract last 8 digits
  const last8A = cleanA.substring(cleanA.length - 8);
  const last8B = cleanB.substring(cleanB.length - 8);
  
  return dddA === dddB && last8A === last8B;
}
