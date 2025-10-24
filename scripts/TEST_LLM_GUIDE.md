# LLM Report Generation Testing Guide

Эта инструкция поможет протестировать функциональность LLM-генерации отчетов.

## Доступные Скрипты

### 1. `check-llm-data.js` - Проверка данных БЕЗ вызова LLM ⚡

**Рекомендуется запускать первым!** Этот скрипт НЕ делает вызовы к LLM API и НЕ тратит токены.

**Что проверяет:**
- ✅ ENV переменные установлены
- ✅ Данные отчета загружаются корректно
- ✅ Learning outcomes и module tools загружаются
- ✅ Нет пустых/null значений в критичных данных
- ✅ Структура системного промпта
- ✅ Подготовка данных для LLM

**Использование:**

```bash
# Для менеджерского отчета
node scripts/check-llm-data.js manager <reportId>

# Для студенческого отчета
node scripts/check-llm-data.js student <reportId> <userId>
```

**Пример:**
```bash
node scripts/check-llm-data.js manager b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b
node scripts/check-llm-data.js student b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b 1175321
```

**Вывод:**
- Показывает все проблемы с данными
- Сохраняет подготовленные данные в JSON файл
- Не тратит LLM токены

---

### 2. `test-llm-generation.js` - Полный тест с вызовом LLM 💰

**⚠️ ВНИМАНИЕ: Этот скрипт делает РЕАЛЬНЫЙ вызов к LLM API и ТРАТИТ ТОКЕНЫ!**

**Что проверяет:**
- ✅ Подключение к LLM работает
- ✅ API ключи корректны
- ✅ Генерация проходит успешно
- ✅ Ответ имеет правильный формат
- ✅ Все обязательные поля заполнены
- ✅ Контент включает learning outcomes и tools
- ✅ Качество сгенерированного текста

**Использование:**

```bash
# Для менеджерского отчета
node scripts/test-llm-generation.js manager <reportId>

# Для студенческого отчета
node scripts/test-llm-generation.js student <reportId> <userId>
```

**Пример:**
```bash
node scripts/test-llm-generation.js manager b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b
node scripts/test-llm-generation.js student b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b 1175321
```

**Вывод:**
- Полный отчет о генерации
- Сохраняет ответ LLM в JSON файл
- Показывает примеры сгенерированного текста

---

## Рекомендуемый порядок тестирования

### Шаг 1: Проверка окружения

Убедитесь, что установлены все ENV переменные в `.env.local`:

```bash
LITELLM_API_KEY=ваш_ключ
LITELLM_BASE_URL=https://ваш_базовый_url
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Шаг 2: Запустите приложение

```bash
npm run dev
```

Приложение должно быть запущено на `http://localhost:3000`

### Шаг 3: Найдите reportId для тестирования

Откройте http://localhost:3000/dashboard и выберите отчет. ID будет в URL:
```
http://localhost:3000/reports/b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b
                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                            reportId
```

Для студенческого отчета также нужен userId. Откройте отчет и кликните на студента:
```
http://localhost:3000/student/1175321?reportId=...
                               ^^^^^^^
                               userId
```

### Шаг 4: Проверка данных (без расхода токенов)

```bash
# Менеджерский отчет
node scripts/check-llm-data.js manager b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b

# Студенческий отчет
node scripts/check-llm-data.js student b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b 1175321
```

**Ожидаемый результат:**
- ✅ Все ENV переменные установлены
- ✅ Данные отчета загружены
- ✅ Learning outcomes найдены (если добавлены)
- ✅ Module tools найдены (если добавлены)
- ✅ Нет критичных пустых значений
- ✅ Системный промпт включает references на outcomes/tools

### Шаг 5: Полный тест с LLM (ТРАТИТ ТОКЕНЫ!)

⚠️ **Только если шаг 4 прошел успешно!**

```bash
# Менеджерский отчет
node scripts/test-llm-generation.js manager b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b

# Студенческий отчет
node scripts/test-llm-generation.js student b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b 1175321
```

У вас будет 3 секунды чтобы отменить (Ctrl+C).

**Ожидаемый результат:**
- ✅ API вызов успешен (status 200)
- ✅ Все поля ответа присутствуют
- ✅ Контент не пустой
- ✅ Упоминаются learning outcomes (если есть)
- ✅ Упоминаются tools (если есть)
- ✅ Текст на английском языке
- ✅ Качество текста хорошее

---

## Интерпретация результатов

### ✅ Успешный тест

Вы увидите:
```
✅ LLM connection working
✅ API endpoint accessible
✅ Response format correct
✅ All required fields present
✅ Content generated successfully
🎉 All tests passed!
```

### ❌ Проблемы с ENV переменными

```
❌ LITELLM_API_KEY is not set in .env.local
```

**Решение:** Добавьте переменные в `.env.local`

### ❌ Данные не найдены

```
❌ Failed to fetch report: 404
```

**Решение:** Проверьте, что reportId правильный и отчет существует

### ⚠️ Нет learning outcomes

```
⚠️ No learning outcomes found
```

**Это нормально** если вы еще не добавили learning outcomes для этого отчета.
Чтобы добавить:
1. Откройте http://localhost:3000/reports/[reportId]/preview/settings
2. Нажмите "✨ Generate Learning Outcomes" для каждого модуля
3. Нажмите "🔧 Generate Module Tools" для каждого модуля
4. Запустите тест снова

### ⚠️ Content does not mention learning outcomes

```
⚠️ Content does not mention learning outcomes
```

**Возможные причины:**
1. Learning outcomes не были добавлены в отчет
2. LLM решил не упоминать их (редко)
3. Данные не были переданы в LLM

**Решение:** 
- Проверьте что outcomes существуют через `check-llm-data.js`
- Проверьте содержимое `test-llm-response.json`

---

## Отладка

### Проверка подготовленных данных

После запуска `check-llm-data.js` откройте сохраненный JSON файл:

```bash
cat llm-data-check-manager-*.json
```

Проверьте:
- `promptData.learningOutcomes` - должен содержать массив outcomes
- `promptData.moduleTools` - должен содержать массив tools
- `issues` - список проблем с данными

### Проверка ответа LLM

После запуска `test-llm-generation.js` откройте:

```bash
cat test-llm-response.json
```

Проверьте:
- `content.executiveSummary` (или `content.learningJourney` для студента)
- Поищите упоминания конкретных learning outcomes
- Поищите упоминания tools

### Проверка логов приложения

В терминале где запущен `npm run dev` смотрите на:
- Ошибки при загрузке outcomes/tools
- 401 Unauthorized ошибки
- Проблемы с Cogniterra API

---

## Частые проблемы и решения

### 1. "Cannot find module 'dotenv'"

```bash
npm install dotenv
```

### 2. "ECONNREFUSED" при вызове localhost:3000

**Решение:** Убедитесь что приложение запущено (`npm run dev`)

### 3. "401 Unauthorized" в логах

**Причина:** Проблемы с авторизацией в API
**Решение:** Убедитесь что вы авторизованы как admin в приложении

### 4. LLM API timeout

**Причина:** Слишком долгий ответ от LLM
**Решение:** Это нормально для больших отчетов, подождите или уменьшите количество студентов

### 5. "Module not found: Can't resolve 'fs'"

**Решение:** Скрипты должны запускаться через Node.js, не в браузере:
```bash
node scripts/check-llm-data.js ...
```

---

## Дополнительная информация

### Структура менеджерского отчета

Обязательные поля в ответе:
- `executiveSummary`
- `skillsAcquired`
- `teamEngagement`
- `expertObservations`
- `recommendations`

### Структура студенческого отчета

Обязательные поля в ответе:
- `learningJourney`
- `strengthsAchievements`
- `skillsDevelopment`
- `instructorFeedback`
- `growthOpportunities`
- `nextSteps`

### Полезные ссылки

- [LLM Setup Guide](../SETUP_LITELLM.md)
- [LLM User Guide](../docs/LLM_USER_GUIDE.md)
- [Learning Outcomes Feature](../docs/learning-outcomes-feature.md)
- [Module Tools Feature](../docs/module-tools-feature.md)

