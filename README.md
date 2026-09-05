# VITA

Локальная веб-система для тренировок, питания, привычек, целей и общего
контроля здоровья. Local-first PWA: без сервера, без аккаунта, без AI, без
фото — все данные хранятся на устройстве в IndexedDB.

## Стек

Vue 3 + TypeScript, Vue Router, Pinia, Naive UI, Dexie.js (IndexedDB), Zod,
dayjs, ECharts, vite-plugin-pwa, Vitest + Playwright.

## Разработка

```bash
npm install
npm run dev        # dev-сервер
npm run build       # production-сборка
npm run test         # unit/integration-тесты (Vitest)
npm run test:e2e     # e2e-тесты (Playwright)
npm run typecheck    # проверка типов
```

## Статус реализации

Готово (см. §42 рекомендуемой последовательности разработки из ТЗ):

- Проект (Vite + Vue 3 + TS), базовый набор зависимостей.
- Domain-типы и схема Dexie v1 (`src/database/types.ts`, `src/database/db.ts`).
- Repository-слой поверх Dexie — компоненты не обращаются к `db.table(...)`
  напрямую (`src/database/repositories`).
- Seed-данные: базовая библиотека упражнений и 5 предустановленных программ
  (`src/database/seed`).
- App shell и адаптивная навигация (desktop sidebar / мобильный bottom nav с
  центральным «+»).
- Экран «Сегодня» на реальных repository-запросах (цель, питание, вода, сон,
  активность, тренировка, самочувствие, быстрые действия).

Ещё не реализовано (заглушки в интерфейсе): полноценный дневник питания,
конструктор и прохождение тренировок, календарь, привычки, аналитика,
настройки, backup/import — следующие этапы по плану ТЗ.
