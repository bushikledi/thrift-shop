/**
 * Logger tests (M0 regression).
 *
 * The error method used to skip console.error entirely when the context was
 * valid but its `error` value was not an Error instance, silently dropping the
 * log. These cases pin down that an error is always emitted to the console.
 */
import { logger } from "@/lib/logger";

describe("logger.error", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("logs when context contains a non-Error value (the regression)", () => {
    logger.error("API Error", { status: 500, url: "/api/v1/products" });
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it("logs when an Error instance is passed as context", () => {
    logger.error("Boom", { error: new Error("kaboom") });
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it("logs with no context at all", () => {
    logger.error("Something failed");
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it("logs even when the context is an empty object", () => {
    logger.error("Empty context", {});
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});
