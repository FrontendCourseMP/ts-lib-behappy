import { FormValidator } from '../src/FormValidator';
import * as v from '../src/validator';

/**
 * ## Выводит сообщение о проверке его соотвествующего состояния
 *
 * @param condition: boolean
 * @param message: string
 *
 * @return void
 */
function assert(condition: boolean, message: string): void {
  const output = document.getElementById('testResults');
  if (!condition) {
    if (output) {
      output.innerHTML += `<div class="test-fail">${message}</div>`;
    }
    console.error(`${message}`);
  } else {
    if (output) {
      output.innerHTML += `<div class="test-pass">✅ ${message}</div>`;
    }
    console.log(`✅ ${message}`);
  }
}

// Утилита: проверяет наличие ошибки по сообщению
function hasError(
  results: Record<string, { valid: boolean; message?: string }[]>,
  add: string,
  expectedMsg: string
): boolean {
  const addResults = results[add] || [];
  return addResults.some((r) => !r.valid && r.message === expectedMsg);
}

// === Тесты
export function runTests() {
  console.log('\nЗапуск тестов...\n');

  // Happy Path
  (() => {

    //=========регистрируем форму и его поля
    const validator = new FormValidator()
      .regID('name', v.required, v.minLength(2))
      .regID('email', v.email)
      .regID('password', v.required, v.minLength(6));
    validator    //даем полям содержание
      .set('name', 'Artem')
      .set('email', 'a@b.c')
      .set('password', '123456');

    const results = validator.validate();//отправляем на проверку
    assert(validator.isValid(), 'Happy Path: все поля валидны');//сообщение вперед
    assert(!hasError(results, 'name', 'Минимум 2 символа'), 'Happy Path: нет ошибки длины имени');
    assert(!hasError(results, 'email', 'Некорректный email'), 'Happy Path: нет ошибки email');
    assert(!hasError(results, 'password', 'Минимум 6 символов'), 'Happy Path: нет ошибки пароля');
  })();

  // Злые тесты
  (() => {
    //===========VALIDATE 1 =====================
    let validator = new FormValidator().regID('name', v.required);//регистрируем поле
    validator.set('name', '');//содержание
    assert(hasError(validator.validate(), 'name', 'Обязательное поле'), 'Злой тест: пустое имя → ошибка');
    //================= end ========================

    //===========VALIDATE 1 =====================
    validator = new FormValidator().regID('email', v.email);
    validator.set('email', 'bad');
    assert(hasError(validator.validate(), 'email', 'Некорректный email'), 'Злой тест: email без @ → ошибка');
    //================= end ========================

    //===========VALIDATE 1 =====================
    validator = new FormValidator().regID('password', v.minLength(6));
    validator.set('password', '12345');
    assert(hasError(validator.validate(), 'password', 'Минимум 6 символов'), 'Злой тест: пароль из 5 симв. → ошибка');
    //================= end ========================

  })();

  // Проверка веток if/else
  (() => {
    //===========VALIDATE =====================
    const validator = new FormValidator()
      .regID('test', v.minLength(3));
    validator.set('test', 'ab');
    assert(hasError(validator.validate(), 'test', 'Минимум 3 символа'), 'Ветка if: строка короче → ошибка');

    //===========VALIDATE =====================
    validator.set('test', 'abc');
    assert(!hasError(validator.validate(), 'test', 'Минимум 3 символа'), 'Ветка else: строка достаточна → OK');

    //===========VALIDATE =====================
    const numValidator = new FormValidator().regID('x', v.isString);
    numValidator.set('x', 123);
    assert(hasError(numValidator.validate(), 'x', 'Должно быть строкой'), 'Ветка type check: число → ошибка');
  })();

  console.log('\nВсе тесты пройдены!\n');
}
