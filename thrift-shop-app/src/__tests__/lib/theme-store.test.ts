/**
 * Theme store tests (M3).
 *
 * Covers the logic that makes theme selection actually do something: resolving
 * "system" against the OS preference and toggling the `dark` class on <html>.
 */
import { applyTheme, useThemeStore } from "@/lib/stores/theme-store";

function setSystemPrefersDark(prefersDark: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: query.includes("dark") ? prefersDark : false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
    onchange: null,
  }));
}

describe("applyTheme", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("adds the dark class for the dark theme", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes the dark class for the light theme", () => {
    document.documentElement.classList.add("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("follows the OS when set to system (dark)", () => {
    setSystemPrefersDark(true);
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("follows the OS when set to system (light)", () => {
    setSystemPrefersDark(false);
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

describe("useThemeStore", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
  });

  it("applies the theme as a side effect of setTheme", () => {
    useThemeStore.getState().setTheme("dark");
    expect(useThemeStore.getState().theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
