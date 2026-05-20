# China Orders

Веб-приложение для приёма заявок на товары из Китая.

## Стек

- **Frontend**: Next.js 14 (App Router)
- **База данных**: Supabase (PostgreSQL + Auth + Storage)
- **Деплой**: Vercel

## Структура проекта

```
src/
├── app/
│   ├── auth/           # Страницы авторизации
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/      # Личный кабинет клиента
│   │   ├── orders/     # Список заявок
│   │   └── new-order/  # Создание заявки
│   └── api/            # API routes
│       ├── orders/
│       ├── auth/
│       └── admin/
├── components/
│   ├── ui/             # Базовые UI компоненты
│   ├── forms/          # Формы
│   └── layout/         # Шапка, футер, навигация
├── lib/
│   ├── supabase/       # Клиент Supabase
│   ├── utils/          # Утилиты
│   └── validations/    # Схемы валидации (zod)
├── types/              # TypeScript типы
└── hooks/              # Кастомные React хуки
supabase/
├── migrations/         # SQL миграции
└── seed/               # Тестовые данные
```

## Запуск

```bash
cp .env.example .env.local
npm install
npm run dev
```
