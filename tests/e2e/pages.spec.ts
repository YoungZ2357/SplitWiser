import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("/share/:billId loads without crashing for non-existent bill", async ({
    page,
  }) => {
    await page.goto("/share/nonexistent-id");
    // Page should render (not a 500 crash) — it may show an error state
    await expect(page.locator("body")).toBeVisible();
  });

  test("/login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();
  });
});
