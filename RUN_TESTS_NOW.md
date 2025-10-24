# 🚀 Запуск Тестов LLM (Quick Start)

## Шаг 1: Установка зависимости

```bash
npm install --save-dev dotenv
```

## Шаг 2: Настрой авторизацию для тестов

Добавь в `.env.local`:

```bash
TEST_ADMIN_EMAIL=your-admin@email.com
TEST_ADMIN_PASSWORD=your-password
```

**Важно:** Используй свой **admin** аккаунт. Скрипты будут автоматически авторизовываться через Supabase API.

## Шаг 3: Убедись что приложение запущено

```bash
npm run dev
```

Должно работать на http://localhost:3000

## Шаг 4: Найди reportId

1. Открой http://localhost:3000/dashboard
2. Выбери отчет
3. Скопируй ID из URL:
   ```
   http://localhost:3000/reports/b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b
                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                            reportId
   ```

Для студенческого отчета также нужен userId:
```
http://localhost:3000/student/1175321?reportId=...
                               ^^^^^^^
                               userId
```

## Шаг 5: Проверка данных (БЕЗ расхода токенов)

### Для менеджерского отчета:
```bash
node scripts/check-llm-data.js manager ТВОЙ_REPORT_ID
```

Пример:
```bash
node scripts/check-llm-data.js manager b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b
```

### Для студенческого отчета:
```bash
node scripts/check-llm-data.js student ТВОЙ_REPORT_ID ТВОЙ_USER_ID
```

Пример:
```bash
node scripts/check-llm-data.js student b5b4b3e5-79d7-4f80-8f24-7b21681b0f0b 1175321
```

### Что должно произойти:

✅ Все проверки прошли успешно:
```
✅ LITELLM_API_KEY: sk-testKeyRea...
✅ LITELLM_BASE_URL: https://litellm...
✅ Supabase credentials found
✅ TEST_ADMIN_EMAIL is set: admin@example.com
🔐 Step 1.5: Authenticating with Supabase
✅ Authentication successful!
✅ Report fetched: Course 678 Report
✅ Learning outcomes fetched: 5 modules
✅ Module tools fetched: 5 modules
✅ No critical empty values found
✅ System prompt includes: Learning Outcomes
✅ Data check complete!
```

❌ Если ошибка:
- Проверь что `.env.local` содержит все нужные переменные (включая `TEST_ADMIN_EMAIL` и `TEST_ADMIN_PASSWORD`)
- Проверь что email/password правильные и аккаунт имеет роль admin
- Проверь что reportId правильный
- Проверь что приложение запущено

## Шаг 6: Полный тест с LLM (ТРАТИТ ТОКЕНЫ!)

⚠️ **ТОЛЬКО если шаг 5 прошел успешно!**

### Для менеджерского отчета:
```bash
node scripts/test-llm-generation.js manager ТВОЙ_REPORT_ID
```

### Для студенческого отчета:
```bash
node scripts/test-llm-generation.js student ТВОЙ_REPORT_ID ТВОЙ_USER_ID
```

У тебя будет 3 секунды чтобы отменить (Ctrl+C).

### Что должно произойти:

✅ Успешная генерация:
```
✅ TEST_ADMIN_EMAIL is set: admin@example.com
✅ TEST_ADMIN_PASSWORD is set
🔐 Step 1.5: Authenticating with Supabase
✅ Authentication successful!
⚠️  This will make a REAL API call to LLM and consume tokens!
⚠️  Press Ctrl+C within 3 seconds to cancel...

✅ API returned status 200
✅ Response has success: true
✅ Response has content field
✅ Field executiveSummary: 1234 characters
✅ Field skillsAcquired: 2345 characters
...
✅ Content mentions learning outcomes
✅ Content mentions tools
🎉 All tests passed!
```

Полный ответ сохранится в `test-llm-response.json`.

## Что проверяют тесты:

### `check-llm-data.js` (БЕЗ токенов):
1. ✅ ENV переменные установлены
2. ✅ Данные отчета загружаются
3. ✅ Learning outcomes загружаются
4. ✅ Module tools загружаются
5. ✅ Нет пустых значений
6. ✅ Системный промпт правильный

### `test-llm-generation.js` (С токенами):
1. ✅ Подключение к LLM работает
2. ✅ API ключи корректны
3. ✅ Генерация успешна
4. ✅ Формат ответа правильный
5. ✅ Все поля заполнены
6. ✅ Упоминаются learning outcomes
7. ✅ Упоминаются tools

## Частые проблемы:

### "Cannot find module 'dotenv'"
```bash
npm install --save-dev dotenv
```

### "ECONNREFUSED localhost:3000"
Запусти приложение:
```bash
npm run dev
```

### "401 Unauthorized"
Авторизуйся как admin в приложении через браузер.

### "No learning outcomes found"
Это нормально если outcomes еще не добавлены. Добавь их:
1. Открой http://localhost:3000/reports/[reportId]/preview/settings
2. Нажми "✨ Generate Learning Outcomes" для каждого модуля
3. Нажми "🔧 Generate Module Tools" для каждого модуля
4. Запусти тест снова

## Дополнительная информация

📖 Полная документация: [scripts/TEST_LLM_GUIDE.md](scripts/TEST_LLM_GUIDE.md)

## Что дальше?

После успешного теста:
1. Проверь `test-llm-response.json` - посмотри на сгенерированный контент
2. Проверь что LLM упоминает конкретные learning outcomes
3. Проверь что LLM упоминает конкретные tools
4. Если качество плохое - можно улучшить системный промпт в API routes

---

**Готово!** Теперь ты можешь быть уверен что LLM-генерация работает корректно! 🎉

