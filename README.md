
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
import * as v from '../src/validator';

const validator = new FormValidator().regID('name', v.required); // регистрируем поле
validator.set('name', ''); // содержание
const results = validator.validate(); // отправить на валидацию
```
