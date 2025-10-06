# 📤 Данные, отправляемые в LiteLLM

## Общая информация

При генерации AI-отчетов приложение отправляет обработанные данные в LiteLLM прокси Hyperskill. Этот документ описывает точный состав отправляемых данных.

---

## 🏢 Manager Report (Командный отчет)

### Структура данных

```json
{
  "reportTitle": "string",
  "reportDescription": "string", 
  "totalStudents": number,
  "teamComments": { ... },
  "performanceData": [ ... ],
  "dynamicData": [ ... ],
  "studentFeedback": [ ... ]
}
```

### 1. Метаданные отчета

| Поле | Тип | Описание | Пример |
|------|-----|----------|--------|
| `reportTitle` | string | Название отчета | "Python Course 2024-Q1" |
| `reportDescription` | string | Описание отчета | "Final cohort results" |
| `totalStudents` | number | Количество студентов | 23 |

**Источник:** Таблица `reports`

---

### 2. Комментарии команды

| Поле | Тип | Описание |
|------|-----|----------|
| `teamComments.programExpert` | string | Комментарий эксперта программы |
| `teamComments.teachingAssistants` | string | Комментарий ассистентов |
| `teamComments.learningSupport` | string | Комментарий службы поддержки |

**Источник:** Таблица `reports` (поля `comment_*`)

**⚠️ Приватность:** Может содержать персональные наблюдения

---

### 3. Данные производительности студентов

Массив объектов, по одному на каждого студента:

| Поле | Тип | Описание | Конфиденциальность |
|------|-----|----------|--------------------|
| `user_id` | string | ID студента | 🟠 Средняя |
| `name` | string | Имя студента | 🟠 Средняя |
| `total` | number | Общий балл | 🟢 Низкая |
| `total_pct` | number | Процент выполнения (0-100) | 🟢 Низкая |
| `submissions` | number | Всего попыток | 🟢 Низкая |
| `unique_steps` | number | Уникальных шагов | 🟢 Низкая |
| `correct_submissions` | number | Правильных попыток | 🟢 Низкая |
| `success_rate` | number | Процент успеха (0-1) | 🟢 Низкая |
| `persistence` | number | Попытки на шаг | 🟢 Низкая |
| `efficiency` | number | Правильные на шаг | 🟢 Низкая |
| `active_days` | number | Активных дней | 🟢 Низкая |
| `active_days_ratio` | number | Доля активных дней (0-1) | 🟢 Низкая |
| `effort_index` | number | Индекс усилий (z-score) | 🟢 Низкая |
| `consistency_index` | number | Индекс постоянства | 🟢 Низкая |
| `struggle_index` | number | Индекс затруднений | 🟢 Низкая |
| `meetings_attended` | number | Посещено встреч | 🟢 Низкая |
| `meetings_attended_pct` | number | Процент посещенных встреч | 🟢 Низкая |
| `simple_segment` | string | Сегмент ("Leader engaged", etc.) | 🟢 Низкая |

**Источник:** Обработанные данные из процессора `performance-processor.ts`

**⚠️ Персональные данные:** `user_id`, `name`

---

### 4. Динамические данные (паттерны активности)

Массив объектов с паттернами активности каждого студента:

| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | string | ID студента |
| `name` | string | Имя студента |
| `bezier_p1x` | number | Контрольная точка 1 кривой Безье (x) |
| `bezier_p1y` | number | Контрольная точка 1 кривой Безье (y) |
| `bezier_p2x` | number | Контрольная точка 2 кривой Безье (x) |
| `bezier_p2y` | number | Контрольная точка 2 кривой Безье (y) |
| `t25` | number | Время достижения 25% активности |
| `t50` | number | Время достижения 50% активности |
| `t75` | number | Время достижения 75% активности |
| `frontload_index` | number | Индекс frontload (0-1) |
| `easing_label` | string | Тип кривой ("linear", "ease-in", etc.) |
| `consistency` | number | Постоянство активности |
| `burstiness` | number | Всплески активности |
| `activity_platform` | number | Активность на платформе |
| `activity_meetings` | number | Активность на встречах |
| `activity_total` | number | Общая активность |

**Источник:** Обработанные данные из процессора `dynamic-processor.ts`

---

### 5. Индивидуальные комментарии студентов

Массив объектов с персональными комментариями:

| Поле | Тип | Описание | Конфиденциальность |
|------|-----|----------|--------------------|
| `user_id` | string | ID студента | 🟠 Средняя |
| `comment_program_expert` | string | Комментарий эксперта | 🟠 Средняя |
| `comment_teaching_assistants` | string | Комментарий ассистентов | 🟠 Средняя |
| `comment_learning_support` | string | Комментарий поддержки | 🟠 Средняя |

**Источник:** Таблица `student_comments`

**⚠️ Приватность:** Содержит персональные наблюдения преподавателей

---

### 6. Статистика submissions (агрегированная) **НОВОЕ**

Агрегированные данные для углубленного анализа:

| Поле | Тип | Описание |
|------|-----|----------|
| `submissionsStats.totalSubmissions` | number | Всего попыток в курсе |
| `submissionsStats.sampleSize` | number | Размер выборки (макс 100) |
| `submissionsStats.topicDistribution` | object | Распределение попыток по топикам |

**Источник:** Агрегация из `submissions_data`

**📝 Примечание:** Передаются только статистические данные, не сырые submissions

---

### 7. Структура курса (агрегированная) **НОВОЕ**

Общая информация о структуре курса:

| Поле | Тип | Описание |
|------|-----|----------|
| `courseStructure.totalTopics` | number | Количество уникальных топиков |
| `courseStructure.totalSteps` | number | Количество уникальных шагов |

**Источник:** Агрегация из `structure_data`

---

## 👤 Student Report (Персональный отчет)

### Структура данных

```json
{
  "studentName": "string",
  "performance": { ... },
  "dynamics": { ... },
  "activityTimeline": [ ... ],
  "feedback": { ... }
}
```

### 1. Базовая информация

| Поле | Тип | Описание | Конфиденциальность |
|------|-----|----------|--------------------|
| `studentName` | string | Имя студента | 🟠 Средняя |

---

### 2. Данные производительности

Объект с метриками производительности **одного** студента (те же поля, что в `performanceData` выше).

---

### 3. Динамические данные

Объект с паттернами активности **одного** студента (те же поля, что в `dynamicData` выше).

---

### 4. Временная линия активности

Массив точек активности по дням:

| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | string | ID студента |
| `date` | string | Дата |
| `x_norm` | number | Нормализованное время (0-1) |
| `y_norm` | number | Нормализованная активность (0-1) |
| `platform` | number | Активность на платформе |
| `meetings` | number | Активность на встречах |

**Источник:** Обработанные данные из `dynamic_series`

**📝 Примечание:** Данные нормализованы, точные timestamps не передаются

---

### 5. Комментарии преподавателей

Объект с персональными комментариями для **одного** студента:

| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | string | ID студента |
| `comment_program_expert` | string | Комментарий эксперта |
| `comment_teaching_assistants` | string | Комментарий ассистентов |
| `comment_learning_support` | string | Комментарий поддержки |

**Источник:** Таблица `student_comments`

---

### 6. Анализ submissions студента (агрегированный) **НОВОЕ**

Детальная статистика по топикам для конкретного студента:

| Поле | Тип | Описание |
|------|-----|----------|
| `submissionsAnalysis.totalSubmissions` | number | Всего попыток студента |
| `submissionsAnalysis.correctSubmissions` | number | Правильных попыток |
| `submissionsAnalysis.successRate` | number | Общий процент успеха (0-1) |
| `submissionsAnalysis.topicPerformance` | array | Производительность по топикам |

**Структура topicPerformance:**
- `topic` (string) - название топика
- `attempts` (number) - попыток в топике
- `correctRate` (number) - процент правильных (0-1)
- `uniqueSteps` (number) - уникальных шагов пройдено

**Источник:** Агрегация из `submissions_data` для конкретного студента

**📝 Примечание:** LLM использует эти данные для выявления сильных и слабых топиков

---

## ❌ Что НЕ отправляется

### Никогда не отправляется:

- ❌ **Email адреса** студентов
- ❌ **Пароли** или токены доступа
- ❌ **Содержимое решений** студентов (код, текст ответов)
- ❌ **Детальные логи** с точными timestamps
- ❌ **IP адреса**
- ❌ **Личная переписка**
- ❌ **Сырые CSV данные** (только обработанные метрики)
- ❌ **Данные других студентов** (в student report)

---

## 🔒 Уровни конфиденциальности

### 🟢 Низкая (агрегированные метрики)
- Баллы, проценты, количества
- Индексы (effort, consistency, struggle)
- Статистика посещаемости
- Паттерны кривых активности

### 🟠 Средняя (персональные данные)
- **Имена студентов**
- **User IDs**
- **Комментарии преподавателей**

### 🔴 Высокая (НЕ отправляется)
- Email, пароли, содержимое решений

---

## 🛡️ Меры безопасности

1. **Транспорт:**
   - ✅ HTTPS для всех запросов
   - ✅ Внутренний прокси Hyperskill (не публичный OpenAI)

2. **Доступ:**
   - ✅ Только админы могут генерировать отчеты
   - ✅ API ключ хранится server-side (не в браузере)

3. **Обработка:**
   - ✅ Только обработанные метрики (не сырые данные)
   - ✅ Нормализованные временные ряды
   - ✅ Нет содержимого решений

4. **Хранение:**
   - ✅ Результаты LLM сохраняются в вашей Supabase БД
   - ✅ Вы контролируете публикацию отчетов

---

## 📊 Пример реальных данных

### Manager Report (фрагмент):

```json
{
  "reportTitle": "Python Advanced 2024-Q1",
  "reportDescription": "Final results for cohort #45",
  "totalStudents": 23,
  "teamComments": {
    "programExpert": "Students showed great progress in OOP",
    "teachingAssistants": "Most struggled with async programming",
    "learningSupport": "Good engagement overall"
  },
  "performanceData": [
    {
      "user_id": "123456",
      "name": "John Smith",
      "total": 450,
      "total_pct": 85,
      "submissions": 120,
      "success_rate": 0.78,
      "effort_index": 1.15,
      "simple_segment": "Leader engaged"
    }
  ],
  "submissionsStats": {
    "totalSubmissions": 2450,
    "sampleSize": 100,
    "topicDistribution": {
      "Topic 1": 320,
      "Topic 2": 280,
      "Topic 3": 310
    }
  },
  "courseStructure": {
    "totalTopics": 15,
    "totalSteps": 150
  }
}
```

### Student Report (фрагмент):

```json
{
  "studentName": "John Smith",
  "performance": {
    "user_id": "123456",
    "total_pct": 85,
    "success_rate": 0.78,
    "active_days_ratio": 0.82
  },
  "feedback": {
    "comment_program_expert": "Excellent progress in advanced topics",
    "comment_teaching_assistants": "Very active in discussions"
  },
  "submissionsAnalysis": {
    "totalSubmissions": 120,
    "correctSubmissions": 94,
    "successRate": 0.783,
    "topicPerformance": [
      {
        "topic": "Topic 1",
        "attempts": 35,
        "correctRate": 0.85,
        "uniqueSteps": 10
      },
      {
        "topic": "Topic 2",
        "attempts": 42,
        "correctRate": 0.71,
        "uniqueSteps": 12
      },
      {
        "topic": "Topic 3",
        "attempts": 43,
        "correctRate": 0.79,
        "uniqueSteps": 11
      }
    ]
  }
}
```

---

## 📋 Рекомендации

### ✅ Рекомендуется:
1. Получить согласие студентов на обработку данных
2. Не включать чувствительную информацию в комментарии
3. Использовать внутренний прокси (как настроено)
4. Регулярно очищать старые отчеты

### ⚠️ Будьте осторожны:
1. Комментарии преподавателей могут содержать личную информацию
2. Имена студентов передаются для персонализации
3. User IDs могут быть связаны с другими системами

---

## 🔗 Связанные документы

- **Техническая документация:** `docs/llm-reports-feature.md`
- **Настройка:** `docs/LLM_SETUP.md`
- **Руководство пользователя:** `docs/LLM_USER_GUIDE.md`
- **Изменения для LiteLLM:** `CHANGES_FOR_LITELLM.md`

---

**Последнее обновление:** 2025-10-06  
**Версия:** 1.0

