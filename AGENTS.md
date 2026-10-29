# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Screen navigation

Whenever a screen is added, removed, or altered, verify the full user flow (route file, `src/config/screens.ts` / `ROUTES`, stack `_layout` index, and `router.push`/`replace` wiring). Do not leave success steps as alerts when a screen belongs in the flow. See `.cursor/rules/screen-navigation-flow.mdc`.
