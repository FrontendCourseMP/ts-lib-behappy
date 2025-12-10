import { type ValidatorFn, type ValidationResult } from './types/types';

export type FieldRule = {
  name: string;
  validators: ValidatorFn[];
};

export class FormValidator {
  private rules: FieldRule[] = [];
  private values: Record<string, unknown> = {};

  // Добавить поле + валидаторы
  field(name: string, ...validators: ValidatorFn[]): this {
    this.rules.push({ name, validators });
    return this;
  }

  // Установить значение поля
  set(name: string, value: unknown): this {
    this.values[name] = value;
    return this;
  }

  // Валидировать одно поле
  validateField(name: string): ValidationResult[] {
    const rule = this.rules.find(r => r.name === name);
    if (!rule) return [{ valid: false, message: `Поле "${name}" не зарегистрировано` }];
    const value = this.values[name] ?? '';
    return rule.validators.map(fn => fn(value));
  }

  // Валидировать всю форму
  validate(): Record<string, ValidationResult[]> {
    const result: Record<string, ValidationResult[]> = {};
    for (const rule of this.rules) {
      result[rule.name] = this.validateField(rule.name);
    }
    return result;
  }

  // Проверить, валидна ли вся форма (без ошибок)
  isValid(): boolean {
    const results = this.validate();
    return Object.values(results).every(checks =>
      checks.every(r => r.valid)
    );
  }

  // JSON
  export(): Record<string, string[]> {
    const mapping: Record<string, string[]> = {};

    for (const rule of this.rules) {
      const names = rule.validators.map(fn => {
        //  беру имя функции
        const name = fn.name || 'anonymous';
        return name;
      });
      mapping[rule.name] = names;
    }
    return mapping;
  }
}
