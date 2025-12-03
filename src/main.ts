// Точка входа в ваше решение
// Импортируем библиотеку валидации (b - первая буква от BeHappy)
import * as b from "./index";

// Шаг 1: Находим форму на странице
const formElement = document.querySelector<HTMLFormElement>("form");
if (!formElement) {
  throw new Error("Форма не найдена");
}

// Шаг 2: Создаем валидатор для этой формы
// При создании валидатор автоматически найдет все поля, label и контейнеры для ошибок
const validator = b.form(formElement);

// Шаг 3: Настраиваем правила валидации для полей
// Для поля "name" настраиваем:
// - это строка (.string())
// - поле обязательно (.required("Имя обязательно!"))
// - минимальная длина из атрибута minlength (.min("Мало символов!"))
validator.Input("name").string().required("Имя обязательно!").min("Мало символов!");

// Шаг 4: Привязываем валидацию к событию отправки формы
formElement.addEventListener("submit", (event) => {
  // Предотвращаем стандартную отправку формы
  event.preventDefault();

  // Вариант 1: Проверяем всю форму
  const result = validator.validate();

  // Вариант 2: Проверяем только определенные поля
  // const result = validator.validate(["name"]); // проверяем только поле "name"

  // Вариант 3: Проверяем одно конкретное поле
  // const nameResult = validator.validateInput("name");
  // if (!nameResult.isValid) {
  //   // Обработка ошибки для конкретного поля
  // }

  if (result.isValid) {
    // Если форма валидна, можно отправить данные
    // formElement.submit(); // стандартная отправка
    // или отправить через fetch/XMLHttpRequest
  }
  // Если форма невалидна, ошибки уже отображаются автоматически
  // в контейнерах с role="alert" под каждым полем
});

// Дополнительно: валидация при вводе данных (опционально)
// Это позволяет показывать ошибки сразу, когда пользователь вводит данные
const nameInput = formElement.querySelector<HTMLInputElement>('input[name="name"]');
if (nameInput) {
  // Валидируем поле при потере фокуса (когда пользователь уходит с поля)
  nameInput.addEventListener("blur", () => {
    // Валидируем только это поле
    validator.validateInput("name");
  });

  // Опционально: валидация при вводе (можно закомментировать, если не нужно)
  // nameInput.addEventListener("input", () => {
  //   validator.validateInput("name");
  // });
}


// // При отправке формы - проверяем все поля
// form.addEventListener("submit", (event) => {
//   event.preventDefault();
//   const result = validator.validate();
//   if (result.isValid) {
//     form.submit();
//   }
// });

// // При потере фокуса - проверяем только это поле
// nameInput.addEventListener("blur", () => {
//   validator.validateInput("name");
// });

// // Проверяем несколько полей перед отправкой
// const result = validator.validate(["name", "email", "age"]);
