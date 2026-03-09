import "@testing-library/jest-dom";
import { beforeAll, afterAll, afterEach } from "vitest";
import { server } from "./mocks/server";

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));

// Reset handlers between tests so one test doesn't affect another
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());