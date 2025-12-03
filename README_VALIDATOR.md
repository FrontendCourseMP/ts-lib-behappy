# Библиотека валидации формы BeHappy

## Как работает библиотека (для начинающих)

### Основная идея

Библиотека помогает проверять правильность заполнения формы перед отправкой. Вместо того чтобы писать много кода для проверки каждого поля, вы просто описываете правила валидации.

### Простой пример

```typescript
// 1. Импортируем библиотеку (b - первая буква от BeHappy)
import * as b from "./index";

// 2. Находим форму на странице
const formElement = document.querySelector("form");

// 3. Создаем валидатор для этой формы
const validator = b.form(formElement);

// 4. Настраиваем правила валидации
validator.field("name").string().required("Имя обязательно!").min("Мало символов!");

// 5. При отправке формы проверяем её
formElement.addEventListener("submit", (event) => {
  event.preventDefault(); // Не отправляем форму сразу
  const result = validator.validate(); // Проверяем форму
  if (result.isValid) {
    // Если всё правильно - отправляем форму
    formElement.submit();
  }
});
```

### Как это работает внутри

#### Шаг 1: Создание валидатора

Когда вы вызываете `b.form(formElement)`, библиотека:
1. Сохраняет ссылку на форму
2. Находит все поля в форме (input, textarea, select)
3. Для каждого поля ищет:
   - Связанный label (подпись поля)
   - Место для показа ошибок (элемент с `role="alert"`)

#### Шаг 2: Настройка правил

Когда вы пишете `validator.field("name").string().required()`:
1. `field("name")` - выбираем поле с именем "name"
2. `.string()` - говорим, что это строка
3. `.required()` - добавляем правило "обязательное поле"

Библиотека сохраняет эти правила в памяти.

#### Шаг 3: Валидация

Когда вы вызываете `validator.validate()`:
1. Проходим по всем полям, для которых настроены правила
2. Для каждого поля:
   - Получаем его значение
   - Проверяем все правила по очереди
   - Если правило не прошло - сохраняем ошибку
3. Показываем ошибки в специальных контейнерах
4. Возвращаем результат: валидна ли форма и список ошибок

### Структура HTML для работы библиотеки

```html
<form>
  <!-- Поле с label и контейнером для ошибок -->
  <label for="name">Имя</label>
  <input type="text" id="name" name="name" required minlength="3">
  <p role="alert" aria-live="assertive"></p>

  <button type="submit">Отправить</button>
</form>
```

**Важно:**
- У поля должен быть атрибут `name` или `id`
- Label должен быть связан через `for="id_поля"` или поле должно быть внутри `<label>`
- Контейнер для ошибок должен иметь `role="alert"` или `aria-live`

### Типы валидации

#### 1. Строки (string)

```typescript
validator.field("name").string()
  .required("Поле обязательно")      // Обязательное поле
  .min("Минимум 3 символа")          // Минимальная длина (из minlength)
  .max("Максимум 50 символов")       // Максимальная длина (из maxlength)
  .email("Некорректный email")       // Проверка email (для type="email")
  .pattern(/^[A-Z]/, "Должно начинаться с заглавной") // Регулярное выражение
```

#### 2. Числа (number)

```typescript
validator.field("age").number()
  .required("Возраст обязателен")
  .min("Минимум 18")                 // Минимальное значение (из атрибута min)
  .max("Максимум 100")                // Максимальное значение (из атрибута max)
  .positive("Должно быть положительным")
  .integer("Должно быть целым числом")
```

#### 3. Массивы / Чекбоксы (array)

```typescript
validator.field("interests").array()
  .required("Выберите хотя бы один интерес")
  .min("Выберите минимум 2")          // Минимум элементов (из data-min)
  .max("Максимум 5")                  // Максимум элементов (из data-max)
```

HTML для чекбоксов:
```html
<input type="checkbox" name="interests" value="sport" data-min="2">
<input type="checkbox" name="interests" value="music">
<input type="checkbox" name="interests" value="reading">
<p role="alert"></p>
```

### Использование стандартных HTML атрибутов

Библиотека автоматически читает стандартные атрибуты HTML:

- `required` - поле обязательно
- `minlength` / `maxlength` - для строк
- `min` / `max` - для чисел
- `type="email"` - проверка email

```html
<input type="text" name="name" required minlength="3" maxlength="50">
<input type="number" name="age" required min="18" max="100">
<input type="email" name="email" required>
```

### Кастомные сообщения об ошибках

Есть три способа задать сообщение об ошибке:

1. **В коде:**
```typescript
validator.field("name").string().required("Имя обязательно!");
```

2. **В HTML через data-атрибуты:**
```html
<input name="name" data-error-required="Имя обязательно!">
```

3. **Стандартные сообщения** (если не указаны кастомные)

### Полный пример

```html
<!DOCTYPE html>
<html>
<head>
  <title>Пример формы</title>
</head>
<body>
  <form id="myForm">
    <div>
      <label for="name">Имя</label>
      <input type="text" id="name" name="name" required minlength="3">
      <p role="alert" aria-live="assertive"></p>
    </div>

    <div>
      <label for="age">Возраст</label>
      <input type="number" id="age" name="age" required min="18" max="100">
      <p role="alert" aria-live="assertive"></p>
    </div>

    <div>
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>
      <p role="alert" aria-live="assertive"></p>
    </div>

    <button type="submit">Отправить</button>
  </form>

  <script type="module">
    import * as b from "./src/index.js";

    const form = document.getElementById("myForm");
    const validator = b.form(form);

    // Настраиваем валидацию
    validator.field("name").string().required("Имя обязательно!").min("Минимум 3 символа!");
    validator.field("age").number().required("Возраст обязателен!").min("Минимум 18 лет!");
    validator.field("email").string().required("Email обязателен!").email("Некорректный email!");

    // При отправке формы
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const result = validator.validate();

      if (result.isValid) {
        alert("Форма валидна! Можно отправлять.");
        // form.submit(); // или отправка через fetch
      } else {
        alert("Есть ошибки в форме. Проверьте поля.");
      }
    });
  </script>
</body>
</html>
```

### Что происходит при валидации

#### Валидация всей формы

1. Вызывается `validator.validate()` или `validator.validate(["name", "email"])`
2. Для каждого поля с правилами (или только указанных полей):
   - Получается значение поля
   - Проверяются все правила по очереди
   - При первой ошибке останавливается проверка этого поля
   - Ошибка показывается в контейнере с `role="alert"`
   - Поле помечается как невалидное (`aria-invalid="true"`)
3. Возвращается объект:
   ```typescript
   {
     isValid: false,  // Валидна ли форма
     errors: {        // Ошибки по полям
       "name": "Минимум 3 символа!",
       "age": undefined,  // Нет ошибки
       "email": "Некорректный email!"
     }
   }
   ```

#### Валидация конкретного поля

1. Вызывается `validator.validateField("name")`
2. Для указанного поля:
   - Получается значение поля
   - Проверяются все правила по очереди
   - Ошибка показывается в контейнере
   - Поле помечается как невалидное
3. Возвращается объект:
   ```typescript
   {
     isValid: false,  // Валидно ли поле
     error: "Минимум 3 символа!"  // Сообщение об ошибке или undefined
   }
   ```

### Валидация конкретных полей

Теперь вы можете валидировать только те поля, которые нужно:

```typescript
// Валидировать все поля с настроенными правилами
const result = validator.validate();

// Валидировать только определенные поля
const result = validator.validate(["name", "email"]);

// Валидировать одно конкретное поле
const nameResult = validator.validateField("name");
if (!nameResult.isValid) {
  console.log(nameResult.error); // "Имя обязательно!"
}
```

**Примеры использования:**

```typescript
// При отправке формы - проверяем все поля
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = validator.validate();
  if (result.isValid) {
    form.submit();
  }
});

// При потере фокуса - проверяем только это поле
nameInput.addEventListener("blur", () => {
  validator.validateField("name");
});

// Проверяем несколько полей перед отправкой
const result = validator.validate(["name", "email", "age"]);
if (result.isValid) {
  // Все указанные поля валидны
}

// Проверяем одно поле и обрабатываем результат
const emailResult = validator.validateField("email");
if (!emailResult.isValid) {
  // Показываем дополнительное сообщение
  showCustomError(emailResult.error);
}
```

### Полезные советы

1. **Всегда используйте `event.preventDefault()`** перед валидацией, чтобы форма не отправлялась автоматически
2. **Добавляйте `novalidate`** в тег `<form>`, чтобы отключить стандартную валидацию браузера
3. **Используйте `role="alert"`** для контейнеров ошибок - это важно для доступности
4. **Правила можно вызывать цепочкой:** `.required().min().max()` - это называется "method chaining"

### Вопросы и ответы

**Q: Почему используется `import * as b`?**
A: По заданию нужно использовать первую букву названия библиотеки (BeHappy → b) как основу для импорта.

**Q: Можно ли валидировать поля без HTML атрибутов?**
A: Да, но некоторые правила (min, max, minlength, maxlength) читают значения из атрибутов. Если атрибутов нет, правило не применяется.

**Q: Как валидировать несколько полей с одинаковым именем (чекбоксы)?**
A: Используйте `.array()` - библиотека автоматически соберет все выбранные значения.

**Q: Можно ли добавить свои правила валидации?**
A: В текущей версии нет, но можно использовать `.pattern()` с регулярным выражением для сложных проверок.
