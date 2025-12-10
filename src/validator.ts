import { ValidatorFn, ValidationResult } from './types/types';

export const isString: ValidatorFn = (value): ValidationResult =>
  typeof value === 'string' ? { valid: true, type: 'string' } : { valid: false, message: 'Должно быть строкой' };

export const required: ValidatorFn = (value) =>
  value !== null && (typeof value === 'string' ? value.trim() !== '' : true)
    ? { valid: true }
    : { valid: false, message: 'Обязательное поле' };

export const email: ValidatorFn = (value) => {
  const typeRes = isString(value);
  if (!typeRes.valid) return typeRes;
  const str = value as string;
  if (!required(str).valid) return { valid: false, message: 'Email обязателен' };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(str)
    ? { valid: true, type: 'string' }
    : { valid: false, message: 'Некорректный email', type: 'string' };
};

export const minLength = (len: number): ValidatorFn => (value) => {
  const typeRes = isString(value);
  if (!typeRes.valid) return typeRes;
  const str = value as string;
  return str.length >= len
    ? { valid: true }
    : { valid: false, message: `Минимум ${len} символов` };
};
