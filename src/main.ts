import { FormValidator } from './FormValidator';
import * as v from './validator';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('testForm') as HTMLFormElement;
  if (!form) return;

  ['name', 'email', 'password'].forEach(fieldId => {
    const input = document.getElementById(fieldId) as HTMLInputElement;
    if (input) {
      input.addEventListener('input', () => {
        // Перезапускаем валидацию без отправки формы
        validateAndShowErrors(form);
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    validateAndShowErrors(form);
  });

  function validateAndShowErrors(form: HTMLFormElement) {
    const validator = new FormValidator()
      .field('name', v.required, v.minLength(2))
      .field('email', v.email)
      .field('password', v.required, v.minLength(6));

    const data = new FormData(form);
    validator
      .set('name', data.get('name')?.toString() || '')
      .set('email', data.get('email')?.toString() || '')
      .set('password', data.get('password')?.toString() || '');

    const results = validator.validate();

    for (const [field, checks] of Object.entries(results)) {
      const errorEl = document.getElementById(`${field}-error`);
      if (!errorEl) continue;

      const errors = checks.filter(r => !r.valid).map(r => r.message);
      if (errors.length) {
        errorEl.textContent = errors.join('; ');
        errorEl.className = 'error';
      } else {
        errorEl.textContent = '✓ OK';
        errorEl.className = 'error valid';
      }
    }

    if (validator.isValid()) {
      console.log('✅ Форма валидна');
    }
  }
});
