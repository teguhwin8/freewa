---
trigger: always_on
---

Always use new feature and technology from Next.JS for frontend. Don't use custom color or custom size on className.

# FreeWA Project Rules

## API & Security
- Always use **Server Actions** (`'use server'`) instead of direct fetch calls from client components
- Never expose API_URL or API_KEY in client-side code
- Place server actions in `app/actions/` folder

## Code Organization
- Extract reusable utility functions to `lib/utils/` folder
- Format functions → `lib/utils/format.ts`
- API helpers → `lib/api-client.ts`
- Don't duplicate functions across components

## UI/UX Guidelines
- Never display technical IDs (device ID, chat ID, etc.) in UI
- Show only user-friendly info: names, phone numbers, status
- Use Badge component for status indicators
- Use ContactAvatar for profile pictures

## Best Practices
- Use `useCallback` for functions passed as dependencies
- Implement proper error handling with try/catch
- Remove console.log statements before committing
- Use TypeScript interfaces for all data types

## Component Structure
- Keep components focused and single-purpose
- Extract complex logic into custom hooks
- Place shared components in `components/` folder
- Use shadcn/ui components from `components/ui/`
