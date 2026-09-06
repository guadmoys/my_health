# VITA

🔗 **Сайт:** https://guadmoys.github.io/my_health/

VITA — личный трекер здоровья и формы: тренировки, питание, привычки, цели,
сон, шаги и календарь цикла в одном приложении. Это local-first PWA —
работает офлайн, без сервера, без регистрации, без ИИ и без фото: все данные
остаются на устройстве и хранятся в IndexedDB.

## Стек

Vue 3 + TypeScript, Vue Router, Pinia, Ionic Vue, Dexie.js (IndexedDB), Zod,
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

- Проект (Vite + Vue 3 + TS + Ionic Vue), domain-типы и схема Dexie v1.
- Repository-слой поверх Dexie — компоненты не обращаются к `db.table(...)`
  напрямую (`src/database/repositories`).
- Seed-данные: базовая библиотека упражнений и 5 предустановленных программ.
- App shell и адаптивная навигация (desktop sidebar / мобильный bottom nav с
  центральным «+»).
- Экран «Сегодня», дневник питания, конструктор и прохождение тренировок,
  календарь, прогресс (вес/сон/активность) и привычки, аналитика и
  еженедельный обзор, достижения и локальный движок советов, шаги и их
  привязки, календарь цикла с прогнозами и советами, настройки профиля,
  полный backup/restore, PWA/офлайн (service worker, обновление по запросу
  пользователя).

## CI и версионирование

При каждом пуше/PR в `main` GitHub Actions собирает проект (typecheck, тесты,
`vite build`) — см. `.github/workflows/build.yml`. При мердже в `main` версия
в `package.json` повышается автоматически по Conventional Commits —
подробности и правила MAJOR/MINOR/PATCH в [VERSIONING.md](./VERSIONING.md).

При каждом пуше в `main` `.github/workflows/deploy-pages.yml` собирает
проект и публикует `dist/` на GitHub Pages (нужно один раз включить
Settings → Pages → Source: GitHub Actions в репозитории).

## Лицензия

MIT — см. [LICENSE](./LICENSE). Использование и изменение кода разрешены при
условии сохранения указания авторства.
