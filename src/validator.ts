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
}
