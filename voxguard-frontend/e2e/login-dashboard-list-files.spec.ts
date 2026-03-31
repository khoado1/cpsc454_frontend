import { test, expect } from "@playwright/test";

test("login to dashboard and load files", async ({ page }) => {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  test.skip(!username || !password, "Set E2E_USERNAME and E2E_PASSWORD to run this flow.");

  await page.goto("/login");

  await page.getByLabel("Username").fill(username!);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const listFilesResponse = page.waitForResponse(
    (response) => response.url().includes("/binary-files") && response.request().method() === "GET"
  );

  await page.getByRole("button", { name: "Load Files" }).click();
  await listFilesResponse;

  await expect(page.getByRole("heading", { name: "Files" })).toBeVisible();
});