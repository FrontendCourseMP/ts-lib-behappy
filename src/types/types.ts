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

/**
 * Валидатор для массивов (чекбоксы)
 */
export type ArrayValidator = {//все атрибуты по умолчанию будут массивом
  min: (message?: string) => ArrayValidator;
  max: (message?: string) => ArrayValidator;
  required: (message?: string) => ArrayValidator;
};

/**
 * Билдер для валидации поля
 */
export type InputBuilder = {//по выбранному типу устанавливаем проверку атриюутов
  string: () => StringValidator;
  number: () => NumberValidator;
  array: () => ArrayValidator;
};

/**
 * Валидатор формы
 */
export type FormValidator = {//работа с формой
  Input: (InputName: string) => InputBuilder;//опеределяем переменные
  validate: (InputNames?: string[]) => FormValidationResult;//Проверяет все поля или только выбранные (по именам).
  validateInput: (InputName: string) => InputValidationResult;//Проверяет отдельное поле формы по имени.
};


export type FormValidatorFactory = (form: HTMLFormElement) => FormValidator;//определят что это форма и запускает метод выбора данных

/**
 * Конфигурация валидации поля
 */
export type InputValidationConfig = {
  type: "string" | "number" | "array";
  rules: ValidationRule[];
};

/**
 * Правило валидации
 */
export type ValidationRule = {
  name: string;
  validator: (value: unknown) => boolean;
  message?: string;
};

/**
 * Элемент формы с метаданными
 */
export type FormInputMetadata = {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  label?: HTMLLabelElement;
  errorContainer?: HTMLElement;
  name: string;
};
