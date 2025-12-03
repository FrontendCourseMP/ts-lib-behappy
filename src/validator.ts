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

/**
 * Класс для валидации формы
 *
 * Как это работает:
 * 1. При создании валидатора мы получаем форму (HTMLFormElement)
 * 2. Автоматически находим все поля в форме и сохраняем информацию о них
 * 3. Когда вызываем validator.Input("name").string().min(), мы добавляем правила валидации
 * 4. При вызове validate() проверяем все правила и показываем ошибки
 */
class FormValidatorImpl implements FormValidator {
  // Храним ссылку на форму
  private formElement: HTMLFormElement;

  // Храним правила валидации для каждого поля
  // Например: { "name" => { type: "string", rules: [...] } }
  private InputConfigs: Map<string, InputValidationConfig> = new Map();

  // Храним информацию о полях: само поле, его label, место для ошибок
  private InputMetadata: Map<string, FormInputMetadata> = new Map();

  constructor(formElement: HTMLFormElement) {
    this.formElement = formElement;
    // При создании валидатора сразу находим все поля в форме
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
        // Если у поля нет имени, пропускаем его
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
        // Если контейнер не найден, создаем его автоматически
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

  /**
   * Создаем валидатор для числовых полей
   * Пример: validator.Input("age").number().min().max().required()
   */
  private createNumberValidator(InputName: string): NumberValidator {
    const config: InputValidationConfig = {
      type: "number",
      rules: [],
    };
    this.InputConfigs.set(InputName, config);

    const validator: NumberValidator = {
      // Минимальное значение
      min: (message?: string) => {
        config.rules.push({
          name: "min",
          validator: (value) => {
            // Преобразуем значение в число
            const numValue = Number(value);
            // Если не число - ошибка
            if (Number.isNaN(numValue)) {
              return false;
            }

            const Input = this.InputMetadata.get(InputName)?.element as HTMLInputElement;
            if (!Input) {
              return false;
            }

            // Читаем минимальное значение из атрибута min
            if (Input.min) {
              const min = Number.parseFloat(Input.min);
              return numValue >= min;
            }

            return true;
          },
          message,
        });
        return validator;
      },

      // Максимальное значение
      max: (message?: string) => {
        config.rules.push({
          name: "max",
          validator: (value) => {
            const numValue = Number(value);
            if (Number.isNaN(numValue)) {
              return false;
            }

            const Input = this.InputMetadata.get(InputName)?.element as HTMLInputElement;
            if (!Input) {
              return false;
            }

            if (Input.max) {
              const max = Number.parseFloat(Input.max);
              return numValue <= max;
            }

            return true;
          },
          message,
        });
        return validator;
      },

      // Обязательное поле
      required: (message?: string) => {
        config.rules.push({
          name: "required",
          validator: (value) => {
            const Input = this.InputMetadata.get(InputName)?.element;
            if (!Input) {
              return false;
            }

            const isRequired = Input.hasAttribute("required");
            if (isRequired) {
              const numValue = Number(value);
              // Проверяем, что это число и поле не пустое
              return !Number.isNaN(numValue) && value !== "";
            }

            return true;
          },
          message,
        });
        return validator;
      },

      // Положительное число
      positive: (message?: string) => {
        config.rules.push({
          name: "positive",
          validator: (value) => {
            const numValue = Number(value);
            if (Number.isNaN(numValue)) {
              return false;
            }
            return numValue > 0;
          },
          message,
        });
        return validator;
      },

      // Отрицательное число
      negative: (message?: string) => {
        config.rules.push({
          name: "negative",
          validator: (value) => {
            const numValue = Number(value);
            if (Number.isNaN(numValue)) {
              return false;
            }
            return numValue < 0;
          },
          message,
        });
        return validator;
      },

      // Целое число
      integer: (message?: string) => {
        config.rules.push({
          name: "integer",
          validator: (value) => {
            const numValue = Number(value);
            if (Number.isNaN(numValue)) {
              return false;
            }
            return Number.isInteger(numValue);
          },
          message,
        });
        return validator;
      },
    };

    return validator;
  }

  /**
   * Создаем валидатор для массивов (чекбоксы)
   * Пример: validator.Input("interests").array().required().min()
   */
  private createArrayValidator(InputName: string): ArrayValidator {
    const config: InputValidationConfig = {
      type: "array",
      rules: [],
    };
    this.InputConfigs.set(InputName, config);

    const validator: ArrayValidator = {
      // Минимальное количество выбранных элементов
      min: (message?: string) => {
        config.rules.push({
          name: "min",
          validator: (value) => {
            if (!Array.isArray(value)) {
              return false;
            }

            const Input = this.InputMetadata.get(InputName)?.element;
            if (!Input) {
              return false;
            }

            // Читаем минимальное количество из data-min
            const minLengthAttr = Input.getAttribute("data-min");
            if (minLengthAttr) {
              const minLength = Number.parseInt(minLengthAttr, 10);
              return value.length >= minLength;
            }

            // По умолчанию минимум 1 элемент
            return value.length >= 1;
          },
          message,
        });
        return validator;
      },

      // Максимальное количество выбранных элементов
      max: (message?: string) => {
        config.rules.push({
          name: "max",
          validator: (value) => {
            if (!Array.isArray(value)) {
              return false;
            }

            const Input = this.InputMetadata.get(InputName)?.element;
            if (!Input) {
              return false;
            }

            const maxLengthAttr = Input.getAttribute("data-max");
            if (maxLengthAttr) {
              const maxLength = Number.parseInt(maxLengthAttr, 10);
              return value.length <= maxLength;
            }

            // Если ограничения нет, правило проходит
            return true;
          },
          message,
        });
        return validator;
      },

      // Обязательное поле (хотя бы один элемент должен быть выбран)
      required: (message?: string) => {
        config.rules.push({
          name: "required",
          validator: (value) => {
            if (!Array.isArray(value)) {
              return false;
            }

            const Input = this.InputMetadata.get(InputName)?.element;
            if (!Input) {
              return false;
            }

            const isRequired = Input.hasAttribute("required");
            if (isRequired) {
              return value.length > 0;
            }

            return true;
          },
          message,
        });
        return validator;
      },
    };

    return validator;
  }

  /**
   * Проверяем всю форму или только указанные поля
   *
   * @param InputNames - опциональный массив имен полей для проверки
   *                     Если не указан, проверяются все поля с настроенной валидацией
   *
   * Примеры использования:
   * validator.validate() - проверить все поля
   * validator.validate(["name", "email"]) - проверить только поля "name" и "email"
   */
  validate(InputNames?: string[]): FormValidationResult {
    // Объект для хранения ошибок: { "name" => "Ошибка", "age" => undefined }
    const errors: Record<string, string | undefined> = {};
    // Флаг: валидна ли форма
    let isValid = true;

    // Определяем, какие поля нужно проверить
    const InputsToValidate = InputNames
      ? InputNames.filter(name => this.InputConfigs.has(name)) // Проверяем только указанные поля
      : Array.from(this.InputConfigs.keys()); // Проверяем все поля

    // Проходим по полям, которые нужно проверить
    for (const InputName of InputsToValidate) {
      const config = this.InputConfigs.get(InputName);
      if (!config) {
        continue;
      }

      // Получаем информацию о поле
      const metadata = this.InputMetadata.get(InputName);
      if (!metadata) {
        // Если поле не найдено, пропускаем
        continue;
      }

      // Получаем значение поля
      let InputValue: unknown;
      if (config.type === "array") {
        // Для чекбоксов получаем все выбранные значения
        InputValue = this.getCheckboxValues(InputName);
      } else {
        // Для обычных полей просто берем value
        InputValue = metadata.element.value;
      }

      // Проверяем все правила для этого поля
      const InputError = this.validateInputValue(InputValue, config, InputName);

      // Сохраняем ошибку (если есть)
      errors[InputName] = InputError;

      // Если есть ошибка, форма невалидна
      if (InputError) {
        isValid = false;
      }

      // Показываем ошибку пользователю
      this.showError(metadata, InputError);
    }

    // Возвращаем результат валидации
    return {
      isValid,
      errors,
    };
  }

  /**
   * Валидирует одно конкретное поле
   *
   * @param InputName - имя поля для валидации
   *
   * Пример использования:
   * const result = validator.validateInput("name");
   * if (!result.isValid) {
   *   console.log(result.error);
   * }
   */
  validateInput(InputName: string): InputValidationResult {
    // Проверяем, настроена ли валидация для этого поля
    const config = this.InputConfigs.get(InputName);
    if (!config) {
      return {
        isValid: true,
        error: undefined,
      };
    }

    // Получаем информацию о поле
    const metadata = this.InputMetadata.get(InputName);
    if (!metadata) {
      return {
        isValid: true,
        error: undefined,
      };
    }

    // Получаем значение поля
    let InputValue: unknown;
    if (config.type === "array") {
      InputValue = this.getCheckboxValues(InputName);
    } else {
      InputValue = metadata.element.value;
    }

    // Проверяем все правила для этого поля
    const InputError = this.validateInputValue(InputValue, config, InputName);

    // Показываем ошибку пользователю
    this.showError(metadata, InputError);

    // Возвращаем результат
    return {
      isValid: !InputError,
      error: InputError,
    };
  }

  /**
   * Получаем значения выбранных чекбоксов
   */
  private getCheckboxValues(InputName: string): string[] {
    // Находим все чекбоксы с таким именем
    const checkboxes = this.formElement.querySelectorAll<HTMLInputElement>(
      `input[type="checkbox"][name="${InputName}"]`
    );

    // Возвращаем значения только тех, что выбраны
    const selectedValues: string[] = [];
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        selectedValues.push(checkbox.value);
      }
    });

    return selectedValues;
  }

  /**
   * Проверяем значение поля по всем правилам
   * Возвращаем сообщение об ошибке или undefined, если все правила прошли
   */
  private validateInputValue(
    value: unknown,
    config: InputValidationConfig,
    InputName: string
  ): string | undefined {
    // Проходим по всем правилам
    for (const rule of config.rules) {
      // Вызываем функцию проверки
      const isRuleValid = rule.validator(value);

      // Если правило не прошло
      if (!isRuleValid) {
        // Возвращаем сообщение об ошибке (кастомное или по умолчанию)
        return rule.message || this.getDefaultErrorMessage(rule.name, InputName);
      }
    }

    // Все правила прошли - ошибок нет
    return undefined;
  }

  /**
   * Показываем ошибку пользователю
   */
  private showError(metadata: FormInputMetadata, error: string | undefined): void {
    // Если есть место для показа ошибок
    if (metadata.errorContainer) {
      if (error) {
        // Показываем ошибку
        metadata.errorContainer.textContent = error;
        // Убеждаемся, что элемент видим
        if (metadata.errorContainer.style.display === "none") {
          metadata.errorContainer.style.display = "block";
        }
        // Помечаем поле как невалидное
        metadata.element.setAttribute("aria-invalid", "true");
        // Добавляем визуальное выделение поля (красная рамка)
        metadata.element.style.borderColor = "#dc3545";
      } else {
        // Скрываем ошибку
        metadata.errorContainer.textContent = "";
        // Убираем пометку о невалидности
        metadata.element.removeAttribute("aria-invalid");
        // Убираем красную рамку
        metadata.element.style.borderColor = "";
      }
    } else {
      // Если контейнер не найден, показываем ошибку через alert (для отладки)
      // В продакшене это можно убрать или логировать
      if (error) {
        metadata.element.setAttribute("aria-invalid", "true");
        metadata.element.style.borderColor = "#dc3545";
      }
    }
  }

  /**
   * Получаем сообщение об ошибке по умолчанию
   * Сначала проверяем, есть ли кастомное сообщение в data-error-*
   * Если нет - используем стандартное
   */
  private getDefaultErrorMessage(ruleName: string, InputName: string): string {
    const Input = this.InputMetadata.get(InputName);

    // Проверяем, есть ли кастомное сообщение в атрибуте data-error-*
    if (Input) {
      const customMessage = Input.element.getAttribute(`data-error-${ruleName}`);
      if (customMessage) {
        return customMessage;
      }
    }

    // Стандартные сообщения об ошибках
    const defaultMessages: Record<string, string> = {
      required: "Это поле обязательно для заполнения",
      min: "Значение слишком мало",
      max: "Значение слишком велико",
      email: "Некорректный email адрес",
      pattern: "Значение не соответствует формату",
      positive: "Значение должно быть положительным",
      negative: "Значение должно быть отрицательным",
      integer: "Значение должно быть целым числом",
    };

    return defaultMessages[ruleName] || "Ошибка валидации";
  }
}

/**
 * Функция для создания валидатора формы
 *
 * Использование:
 * import * as b from "./index";
 * const validator = b.form(formElement);
 */
export function form(formElement: HTMLFormElement): FormValidator {
  return new FormValidatorImpl(formElement);
}
