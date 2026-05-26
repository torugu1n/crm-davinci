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
