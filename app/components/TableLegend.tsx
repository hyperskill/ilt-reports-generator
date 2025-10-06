'use client';

import { Box, Card, Heading, Text, Table } from '@radix-ui/themes';
import { Accordion } from 'radix-ui';

interface LegendProps {
  mode: 'performance' | 'dynamic';
}

export function TableLegend({ mode }: LegendProps) {
  if (mode === 'performance') {
    return (
      <Card>
        <Accordion.Root type="single" collapsible>
          <Accordion.Item value="legend">
            <Accordion.Trigger>
              <Heading size="3">📊 Что означают колонки таблицы</Heading>
            </Accordion.Trigger>
            <Accordion.Content>
              <Box>
                <Text size="2" weight="bold" mb="3">Простыми словами:</Text>
                <Table.Root size="1" variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Колонка</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Что это значит</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Откуда берётся</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">User ID</Text></Table.Cell>
                      <Table.Cell>Уникальный номер студента</Table.Cell>
                      <Table.Cell>Из ваших файлов</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Name</Text></Table.Cell>
                      <Table.Cell>Имя и фамилия студента</Table.Cell>
                      <Table.Cell>Из learners.csv</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Score %</Text></Table.Cell>
                      <Table.Cell>Процент от максимального балла в группе</Table.Cell>
                      <Table.Cell>Из grade_book.csv</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Submissions</Text></Table.Cell>
                      <Table.Cell>Сколько всего попыток сделал студент</Table.Cell>
                      <Table.Cell>Считается из submissions.csv</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Success Rate</Text></Table.Cell>
                      <Table.Cell>Процент правильных ответов с первой попытки</Table.Cell>
                      <Table.Cell>Правильные ответы ÷ все попытки × 100</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Persistence</Text></Table.Cell>
                      <Table.Cell>Сколько попыток в среднем на одно задание<br/>(больше = больше усилий)</Table.Cell>
                      <Table.Cell>Все попытки ÷ количество заданий</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Efficiency</Text></Table.Cell>
                      <Table.Cell>Сколько заданий решено правильно<br/>(выше = лучше)</Table.Cell>
                      <Table.Cell>Правильные ответы ÷ количество заданий</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Active Days</Text></Table.Cell>
                      <Table.Cell>Сколько дней студент заходил на платформу</Table.Cell>
                      <Table.Cell>Уникальные даты из submissions.csv</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Consistency</Text></Table.Cell>
                      <Table.Cell>Регулярность занятий (0-1, где 1 = каждый день)</Table.Cell>
                      <Table.Cell>Активные дни ÷ общий период обучения</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Effort Index</Text></Table.Cell>
                      <Table.Cell>Насколько активен по сравнению с группой<br/>(выше среднего = положительное число)</Table.Cell>
                      <Table.Cell>Учитывает попытки и активные дни</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Struggle Index</Text></Table.Cell>
                      <Table.Cell>Показатель трудностей в обучении<br/>(выше = больше проблем)</Table.Cell>
                      <Table.Cell>Высокая настойчивость + низкий успех</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Meetings %</Text></Table.Cell>
                      <Table.Cell>Процент посещённых вебинаров/встреч</Table.Cell>
                      <Table.Cell>Из meetings.csv (если есть)</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><Text weight="bold">Segment</Text></Table.Cell>
                      <Table.Cell>К какой группе относится студент</Table.Cell>
                      <Table.Cell>Автоматическое определение по правилам ниже</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>

                <Box mt="4">
                  <Text size="2" weight="bold" mb="2">Группы студентов (Segments):</Text>
                  <Box style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="green">🏆 Leader engaged</Text><br/>
                      Лидеры, активные на встречах: Score ≥80% И посещаемость встреч ≥70%
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="green">⚡ Leader efficient</Text><br/>
                      Эффективные лидеры: Score ≥80% И мало повторных попыток (≤3) И регулярные занятия
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="blue">👥 Balanced + engaged</Text><br/>
                      Средний уровень, активные: Score 30-80% И посещают встречи (≥60%) И регулярность ≥0.4
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="orange">💪 Hardworking but struggling</Text><br/>
                      Стараются, но с трудностями: Высокие усилия И показатель трудностей ≥0.6
                    </Text>
                    <Text as="p" mb="2">
                      <Text weight="bold" color="red">😴 Low engagement</Text><br/>
                      Низкая вовлечённость: Мало попыток (&lt;20) ИЛИ очень низкая активность
                    </Text>
                    <Text as="p" mb="1">
                      <Text weight="bold" color="gray">📊 Balanced middle</Text><br/>
                      Средний уровень: Все остальные студенты
                    </Text>
                  </Box>
                </Box>

                <Box mt="4" p="3" style={{ background: 'var(--blue-a2)', borderRadius: 'var(--radius-2)' }}>
                  <Text size="2" weight="bold" mb="1">💡 Важно знать:</Text>
                  <Text size="2" as="p" mb="1">
                    • Все метрики активности автоматически высчитываются из ваших попыток (submissions)
                  </Text>
                  <Text size="2" as="p" mb="1">
                    • Правильный ответ = 1 балл активности, неправильный = 0.25 балла
                  </Text>
                  <Text size="2" as="p">
                    • Чем выше Consistency, тем регулярнее студент занимается
                  </Text>
                </Box>
              </Box>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </Card>
    );
  }

  return (
    <Card>
      <Accordion.Root type="single" collapsible>
        <Accordion.Item value="legend">
          <Accordion.Trigger>
            <Heading size="3">📈 Что показывает график активности</Heading>
          </Accordion.Trigger>
          <Accordion.Content>
            <Box>
              <Text size="2" weight="bold" mb="3">Простыми словами:</Text>
              <Table.Root size="1" variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Показатель</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Что это значит</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Как понять</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">Easing Label</Text></Table.Cell>
                    <Table.Cell>Тип кривой активности студента</Table.Cell>
                    <Table.Cell>Показывает, как распределялась активность во времени</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">Frontload Index</Text></Table.Cell>
                    <Table.Cell>Когда студент был более активен</Table.Cell>
                    <Table.Cell>Положительное = активен в начале<br/>Отрицательное = активен в конце</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">Consistency</Text></Table.Cell>
                    <Table.Cell>Насколько регулярно занимался</Table.Cell>
                    <Table.Cell>От 0 до 1: чем ближе к 1, тем регулярнее</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">Burstiness</Text></Table.Cell>
                    <Table.Cell>Насколько "скачками" была активность</Table.Cell>
                    <Table.Cell>Выше = работал рывками, ниже = равномерно</Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">t25/t50/t75</Text></Table.Cell>
                    <Table.Cell>Когда выполнено 25%, 50%, 75% работы</Table.Cell>
                    <Table.Cell>Числа от 0 до 1 показывают момент времени</Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>

              <Box mt="4">
                <Text size="2" weight="bold" mb="2">Типы активности (Easing Patterns):</Text>
                <Box style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  <Text as="p" mb="2">
                    <Text weight="bold" color="green">📈 ease-out (Ранний старт)</Text><br/>
                    Студент был очень активен в начале, потом активность снизилась
                  </Text>
                  <Text as="p" mb="2">
                    <Text weight="bold" color="orange">📉 ease-in (Поздний старт)</Text><br/>
                    Студент начал медленно, но к концу стал более активным
                  </Text>
                  <Text as="p" mb="2">
                    <Text weight="bold" color="gray">📊 linear (Равномерная)</Text><br/>
                    Активность распределена равномерно на протяжении всего времени
                  </Text>
                  <Text as="p" mb="2">
                    <Text weight="bold" color="purple">〰️ ease-in-out (S-кривая)</Text><br/>
                    Медленный старт, активная середина, затухание в конце
                  </Text>
                  <Text as="p" mb="2">
                    <Text weight="bold" color="blue">⚖️ ease (Умеренная)</Text><br/>
                    Небольшое ускорение, потом замедление - сбалансированная активность
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="red">❌ no-activity</Text><br/>
                    Нет данных об активности студента
                  </Text>
                </Box>
              </Box>

              <Box mt="4">
                <Text size="2" weight="bold" mb="2">Как читать Frontload Index:</Text>
                <Box style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="green">+0.3 (сильный ранний старт):</Text> 80% работы сделано в первой половине периода
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="blue">0.0 (сбалансированно):</Text> Половину работы к середине периода
                  </Text>
                  <Text as="p" mb="1">
                    <Text weight="bold" color="orange">-0.3 (поздний старт):</Text> Основная работа во второй половине периода
                  </Text>
                </Box>
              </Box>

              <Box mt="4" p="3" style={{ background: 'var(--blue-a2)', borderRadius: 'var(--radius-2)' }}>
                <Text size="2" weight="bold" mb="1">💡 Как считается активность:</Text>
                <Text size="2" as="p" mb="1">
                  <Text weight="bold">1. Активность от попыток:</Text> Каждый правильный ответ = 1 балл, неправильный = 0.25 балла
                </Text>
                <Text size="2" as="p" mb="1">
                  <Text weight="bold">2. Активность от встреч:</Text> Каждая посещённая встреча = 1.5 балла (если есть meetings.csv)
                </Text>
                <Text size="2" as="p" mb="1">
                  <Text weight="bold">3. Накопление:</Text> Баллы накапливаются день за днём, создавая кривую роста
                </Text>
                <Text size="2" as="p">
                  <Text weight="bold">4. Нормализация:</Text> Кривая масштабируется от 0 до 1 для удобного сравнения
                </Text>
              </Box>
            </Box>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </Card>
  );
}
