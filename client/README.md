# Type Learner - Client

React + TypeScript frontend for Type Learner.

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start dev server
npm run dev
```

## Scripts

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/       # Shared/global components
├── pages/            # Route-level views (each page is its own directory)
│   ├── Home/
│   ├── Lobby/
│   ├── Game/
│   ├── Results/
│   └── QuizCreate/
├── hooks/            # Global custom hooks
├── services/         # API client functions
├── types/            # TypeScript interfaces
└── styles/           # Global styles
```

## Path Aliases

Use `@/` to import from `src/`:

```typescript
import { Player } from '@/types';
import { useSocket } from '@/hooks/useSocket';
```
