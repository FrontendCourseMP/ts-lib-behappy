
# Название команды: `BeHappy`

**Члены команды:**
- Нерсисян Артем Арменович (`timqwees`)
- Малявкина Маргарита Александровна (`MargoDeFuego`)

### Требования

- [x] Внутренний API
- [x] Рабочая библиотека валидации

### Пример

*Запуск валидатора:*

```ts
import { FormValidator } from '../src/FormValidator';
import * as value from '../src/validator';

const validator = new FormValidator().regID('name', value.isString); // регистрируем поле и задаем атрибут проверки
validator.set('name', ''); // содержание
const results = validator.validate(); // отправить на валидацию
```
