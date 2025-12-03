import type {
  FormValidator,
  InputBuilder,
  StringValidator,
  NumberValidator,
  ArrayValidator,
  FormValidationResult,
  InputValidationResult,
  InputValidationConfig,
  FormInputMetadata,
} from "./types/types";

class FormValidatorImpl implements FormValidator {
  // Храним ссылку на форму
  private formElement: HTMLFormElement;
  private InputConfigs: Map<string, InputValidationConfig> = new Map();
  private InputMetadata: Map<string, FormInputMetadata> = new Map();

  constructor(formElement: HTMLFormElement) {
    this.formElement = formElement;
    this.initializeFormInputs();
  }

  /**
   * Находим все поля в форме и сохраняем информацию о них
   * Это нужно, чтобы знать:
   * - Где находится поле
   * - Есть ли у него label
   * - Где показывать ошибки
   */
  private initializeFormInputs(): void {
    // Находим все input, textarea, select в форме
    const Inputs = this.formElement.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input, textarea, select"
    );

    // Для каждого поля сохраняем информацию
    Inputs.forEach((Input) => {
      // Имя поля нужно для валидации (атрибут name или id)
      const name = Input.name || Input.id;
      if (!name) {
        return;
      }

      // Ищем label для этого поля
      const label = this.findLabel(Input);

      // Ищем место, где будем показывать ошибки
      const errorContainer = this.findErrorContainer(Input);

      // Сохраняем всю информацию о поле
      this.InputMetadata.set(name, {
        element: Input,
        label,
        errorContainer,
        name,
      });

      // Отладочная информация (можно убрать в продакшене)
      // Проверяем, что контейнер для ошибок найден
      if (!errorContainer) {
        const container = document.createElement("p");
        container.setAttribute("role", "alert");
        container.setAttribute("aria-live", "assertive");
        container.style.color = "#dc3545";
        container.style.margin = "5px 0";
        container.style.minHeight = "20px";

        // Вставляем контейнер после поля
        Input.parentNode?.insertBefore(container, Input.nextSibling);

        // Обновляем метаданные
        this.InputMetadata.set(name, {
          element: Input,
          label,
          errorContainer: container,
          name,
        });
      }
    });
  }

  /**
   * Ищем label для поля
   * Label может быть:
   * 1. Связан через атрибут for="id_поля"
   * 2. Или поле может быть внутри <label>...</label>
   */
  private findLabel(Input: HTMLElement): HTMLLabelElement | undefined {
    // Если у поля есть id, ищем label с for="этот_id"
    if (Input.id) {
      const labelByFor = document.querySelector<HTMLLabelElement>(`label[for="${Input.id}"]`);
      if (labelByFor) {
        return labelByFor;
      }
    }

    // Ищем, может поле находится внутри label
    const labelParent = Input.closest("label");
    if (labelParent) {
      return labelParent;
    }

    return undefined;
  }

  /**
   * Ищем место для показа ошибок
   * Ищем элемент с role="alert" или aria-live рядом с полем
   */
  private findErrorContainer(Input: HTMLElement): HTMLElement | undefined {
    // Сначала смотрим следующий элемент после поля (игнорируя текстовые узлы)
    let nextElement = Input.nextElementSibling;
    while (nextElement) {
      // Если следующий элемент имеет role="alert" или aria-live - это наш контейнер
      const role = nextElement.getAttribute("role");
      const ariaLive = nextElement.getAttribute("aria-live");
      if (role === "alert" || ariaLive !== null) {
        return nextElement as HTMLElement;
      }
      nextElement = nextElement.nextElementSibling;
    }

    // Если не нашли рядом, ищем в родительском элементе
    const parent = Input.parentElement;
    if (parent) {
      // Ищем все элементы с role="alert" или aria-live в родителе
      const alertElements = parent.querySelectorAll<HTMLElement>('[role="alert"], [aria-live]');
      // Берем первый найденный элемент
      if (alertElements.length > 0) {
        return alertElements[0];
      }
    }

    // Если не нашли, ищем в следующем родительском элементе (например, если поле в div)
    let currentParent = Input.parentElement;
    while (currentParent && currentParent !== this.formElement) {
      const alertElement = currentParent.querySelector<HTMLElement>('[role="alert"], [aria-live]');
      if (alertElement) {
        return alertElement;
      }
      currentParent = currentParent.parentElement;
    }

    return undefined;
  }

  /**
   * Начинаем настройку валидации для поля
   * Пример: validator.Input("name") - выбираем поле с именем "name"
   */
  Input(InputName: string): InputBuilder {
    return {
      // Выбираем тип поля: строка, число или массив (чекбоксы)
      string: () => this.createStringValidator(InputName),
      number: () => this.createNumberValidator(InputName),
      array: () => this.createArrayValidator(InputName),
    };
  }

  /**
  * Создаем валидатор для строковых полей
  * Пример: validator.Input("name").string().required().min("Мало символов!")
  */
  private createStringValidator(InputName: string): StringValidator {
    // Создаем конфигурацию для этого поля
    const config: InputValidationConfig = {
      type: "string",
      rules: [], // Здесь будут храниться правила валидации
    };
    // Сохраняем конфигурацию
    this.InputConfigs.set(InputName, config);

    // Создаем объект с методами для настройки валидации
    const validator: StringValidator = {
      // Проверка минимальной длины
      min: (message?: string) => {
        // Добавляем правило валидации
        config.rules.push({
          name: "min",
          // Функция, которая проверяет значение
          validator: (value) => {
            // Если значение не строка - ошибка
            if (typeof value !== "string") {
              return false;
            }

            // Получаем поле из формы
            const Input = this.InputMetadata.get(InputName)?.element;
            if (!Input) {
              return false;
            }

            // Читаем минимальную длину из атрибута minlength
            const minLengthAttr = Input.getAttribute("minlength");
            if (minLengthAttr) {
              const minLength = Number.parseInt(minLengthAttr, 10);
              // Если строка пустая, не проверяем minlength (это делает required)
              if (value.trim().length === 0) {
                return true; // Пустая строка проверяется правилом required
              }
              // Проверяем: длина строки >= минимальной длины
              return value.length >= minLength;
            }

            // Если атрибута нет, но правило min() вызвано,
            // это означает что правило применено, но без конкретного значения
            // В этом случае просто возвращаем true (правило не применяется)
            // Если нужно проверить минимум, используйте атрибут minlength
            return true;
          },
          message, // Сообщение об ошибке (если указано)
        });
        // Возвращаем validator, чтобы можно было вызывать методы цепочкой
        return validator;
      },

      // Проверка максимальной длины
      max: (message?: string) => {
        config.rules.push({
          name: "max",
          validator: (value) => {
            if (typeof value !== "string") {
              return false;
            }
            const Input = this.InputMetadata.get(InputName)?.element;
            if (!Input) {
              return false;
            }

            const maxLengthAttr = Input.getAttribute("maxlength");
            if (maxLengthAttr) {
              const maxLength = Number.parseInt(maxLengthAttr, 10);
              return value.length <= maxLength;
            }

            return true;
          },
          message,
        });
        return validator;
      },

      // Проверка, что поле обязательно
      required: (message?: string) => {
        config.rules.push({
          name: "required",
          validator: (value) => {
            if (typeof value !== "string") {
              return false;
            }
            const Input = this.InputMetadata.get(InputName)?.element;
            if (!Input) {
              return false;
            }

            // Проверяем, есть ли атрибут required
            const isRequired = Input.hasAttribute("required");
            if (isRequired) {
              // Убираем пробелы и проверяем, что строка не пустая
              return value.trim().length > 0;
            }

            // Если поле не обязательное, правило проходит
            return true;
          },
          message,
        });
        return validator;
      },

      // Проверка email
      email: (message?: string) => {
        config.rules.push({
          name: "email",
          validator: (value) => {
            if (typeof value !== "string") {
              return false;
            }
            const Input = this.InputMetadata.get(InputName)?.element;
            if (!Input) {
              return false;
            }

            // Проверяем, что поле имеет type="email"
            if (Input.type === "email") {
              // Простая проверка формата email
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              return emailRegex.test(value);
            }

            return true;
          },
          message,
        });
        return validator;
      },

      // Проверка по регулярному выражению
      pattern: (regex: RegExp, message?: string) => {
        config.rules.push({
          name: "pattern",
          validator: (value) => {
            if (typeof value !== "string") {
              return false;
            }
            // Проверяем, соответствует ли строка регулярному выражению
            return regex.test(value);
          },
          message,
        });
        return validator;
      },
    };

    return validator;
  }
}
