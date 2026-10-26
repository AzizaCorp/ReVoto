import '@testing-library/jest-dom/vitest';

// Every test starts on the root address: the app keeps the view in the path (`/tu-territorio`).
beforeEach(() => {
  window.history.replaceState(null, '', '/');
});
