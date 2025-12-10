export type ValidationResult = {
  valid: boolean;
  message?: string;
  type?: 'string' | 'number' | 'array';
};

export type ValidatorFn = (value: unknown) => ValidationResult;
