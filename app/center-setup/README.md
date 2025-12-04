# Center Setup Screen

This directory contains the refactored Center Setup screen, following industry best practices for React Native/Expo projects.

## Structure

```
center-setup/
├── index.tsx                    # Main screen component
├── constants.ts                 # Constants and configuration
├── hooks/
│   └── use-center-setup.ts     # Business logic hook
├── components/
│   ├── LoadingStep.tsx          # Loading/verifying step component
│   ├── PermissionStep.tsx       # Location permission request step
│   ├── SelectGeozoneStep.tsx   # Geozone selection step
│   ├── GeozoneModal.tsx        # Geozone selection modal
│   ├── CustomCenterForm.tsx    # Custom center input form
│   └── LoadingOverlay.tsx      # Loading overlay component
└── README.md                    # This file
```

## Architecture

### Separation of Concerns

- **Business Logic**: All business logic is extracted to `hooks/use-center-setup.ts`
- **UI Components**: Each step is a separate, reusable component
- **Constants**: All magic numbers and strings are in `constants.ts`
- **Types**: TypeScript types are properly defined

### Components

1. **LoadingStep**: Reusable loading screen with customizable title and message
2. **PermissionStep**: Handles location permission request UI
3. **SelectGeozoneStep**: Main geozone selection interface
4. **GeozoneModal**: Modal for selecting from available geozones
5. **CustomCenterForm**: Form for entering custom center (testing only)
6. **LoadingOverlay**: Overlay shown during async operations

### Custom Hook

`use-center-setup.ts` manages:
- State management for all setup steps
- Async operations (loading geozones, checking location, saving center)
- Error handling and user feedback
- Navigation logic

## Usage

The screen is automatically routed via Expo Router at `/center-setup`. It can be navigated to from:
- Profile screen (when changing center)
- Login flow (when no center is set)

## Benefits of This Structure

1. **Maintainability**: Each component has a single responsibility
2. **Testability**: Business logic is separated from UI
3. **Reusability**: Components can be reused in other screens
4. **Readability**: Clear file structure makes it easy to find code
5. **Scalability**: Easy to add new steps or modify existing ones

## Adding New Steps

1. Create a new component in `components/`
2. Add the step type to `constants.ts`
3. Add the step logic to `use-center-setup.ts`
4. Add the step render in `index.tsx`

