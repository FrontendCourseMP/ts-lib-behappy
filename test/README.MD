# **Документация тестов**

### Требования

* [X] Внутренний API
* [X] Понятная документация кода
* [X] Использование Test систем
* [X] Рабочая библиотека валидации

<hr>

### Пример:

*Запуск тестов*

```ts
import { runTests } from './suite';
runTests();
```

*Запуск валидатора*

```ts
//===========VALIDATE =====================
import { FormValidator } from '../src/FormValidator';

let validator = new FormValidator().regID('name', v.required);//регистрируем поле
validator.set('name', '');//содержание
assert(hasError(validator.validate(), 'name', 'Обязательное поле'), 'Злой тест: пустое имя → ошибка');//вывод сообщения
//================= end ========================
```
