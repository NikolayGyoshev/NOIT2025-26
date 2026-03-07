# NOIT2025-26: Локално пускане (стъпка по стъпка)

Това ръководство е за Windows PowerShell.

## 1) Изисквания

- Node.js 20+ (препоръчително LTS)
- npm (идва с Node.js)

Провери версиите:

```powershell
node -v
npm -v
```

## 2) Влез в правилната папка на проекта

В твоя случай проектът е във вложена папка. Ако си в:

`C:\Users\nikol\Downloads\NOIT2025-26-main`

изпълни:

```powershell
Set-Location .\NOIT2025-26-main
```

След това трябва да виждаш `package.json` в текущата папка.

## 3) Инсталирай зависимостите

```powershell
npm install
```

## 4) Задай environment променливи за development

```powershell
$env:NODE_ENV = 'development'
$env:SESSION_SECRET = 'dev_secret'
```

По желание (ако имаш PostgreSQL локално):

```powershell
$env:DATABASE_URL = 'postgres://localhost:5432/test'
```

## 5) Стартирай проекта

```powershell
npm run dev
```

Приложението се стартира на:

`http://localhost:5000`

## 6) Полезни команди

Проверка на TypeScript:

```powershell
npm run check
```

Production build:

```powershell
npm run build
npm start
```

## 7) Често срещани проблеми

### Грешка: `Could not read package.json`

Причина: не си в правилната папка.

Решение:

```powershell
Set-Location C:\Users\nikol\Downloads\NOIT2025-26-main\NOIT2025-26-main
npm run dev
```

### Портът е зает

```powershell
$env:PORT = 3000
npm run dev
```

### Грешки за база данни

Ако нямаш PostgreSQL, част от функционалностите, зависещи от база, може да не работят. Frontend и основните dev функции обикновено стартират нормално.
