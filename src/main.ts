import { runTests } from '../test/suite';
import { FormValidator } from './FormValidator';
import * as v from './validator';

//тесты
document.getElementById('runTests')?.addEventListener('click', async () => {
  const resultsDiv = document.getElementById('testResults');
  if (!resultsDiv) return;
  resultsDiv.innerHTML = '<p>Запускаю тесты...</p>';
  setTimeout(() => {
    runTests();
  }, 1000);
});

//проверка форм
document.addEventListener('DOMContentLoaded', () => {//дом загрузится
  const forms = document.getElementById('testForm') as HTMLFormElement;
  if (!forms) return;

  ['name', 'email', 'password'].forEach(findID => {
    const input = document.getElementById(findID) as HTMLInputElement;
    if (input) {
      input.addEventListener('input', () => {
        // Перезапускаем валидацию без отправки формы
        validateAndShowErrors(forms);
      });
    }
  });

  //форму отправит
  forms.addEventListener('submit', (EVENT) => {
    EVENT.preventDefault();
    //форму перезапущу
    validateAndShowErrors(forms);
  });

  function validateAndShowErrors(form: HTMLFormElement) {
    const validator = new FormValidator()
      .regID('name', v.required, v.minLength(2)) //регистрируем поле с атрибутами
      .regID('email', v.email)
      .regID('password', v.required, v.minLength(6));

    const data = new FormData(form);

    validator
      .set('name', data.get('name')?.toString() || '') //регистрируем содержание поля
      .set('email', data.get('email')?.toString() || '')
      .set('password', data.get('password')?.toString() || '');

    const results = validator.validate();//валидировать всю форму

    for (const [add, checks] of Object.entries(results)) {
      const errorEl = document.getElementById(`${add} -error`);
      if (!errorEl) continue;

      const errors = checks.filter(r => !r.valid).map(r => r.message);
      if (errors.length) {
        errorEl.textContent = errors.join('; ');
        errorEl.className = 'error';
      } else {
        errorEl.textContent = 'OK';
        errorEl.className = 'error valid';
      }
    }
    if (validator.isValid()) {
      const r = document.createElement('div');
      r.textContent = 'Форма валидна';
      r.id = 'form-valid-result';
      form.parentElement?.appendChild(r);
    }
  }
});
