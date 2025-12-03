/**
 * Сообщение об ошибке валидации
 */
export type ValidationError = string;

/**
 * Результат валидации поля
 */
export type InputValidationResult = {
  isValid: boolean;
  error?: ValidationError;
};

/**
 * Результат валидации всей формы
 */
export type FormValidationResult = {
  isValid: boolean;
  errors: Record<string, ValidationError | undefined>;
};

/**
 * Валидатор для строк
 */
export type StringValidator = {//все атрибуты по умолчанию будут строками
  min: (message?: string) => StringValidator;
  max: (message?: string) => StringValidator;
  required: (message?: string) => StringValidator;
  email: (message?: string) => StringValidator;
  pattern: (regex: RegExp, message?: string) => StringValidator;
};

/**
 * Валидатор для чисел
 */
export type NumberValidator = {//все атрибуты по умолчанию будут числом
  min: (message?: string) => NumberValidator;
  max: (message?: string) => NumberValidator;
  required: (message?: string) => NumberValidator;
  positive: (message?: string) => NumberValidator;
  negative: (message?: string) => NumberValidator;
  integer: (message?: string) => NumberValidator;
};
