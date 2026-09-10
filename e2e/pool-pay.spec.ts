import { test, expect } from "@playwright/test";

/**
 * Pool-pay page specs for states reachable without a browser wallet.
 * Wallet-signed flows (add/remove rows, confirm, new-batch reset) live in
 * pool-pay.wallet.spec.ts and run with E2E_WALLET=connected.
 */

test.describe("pool-pay without wallet", () => {
  test("shows the connect gate with heading and copy", async ({ page }) => {
    await page.goto("/pool-pay");
    await expect(page.getByRole("heading", { name: "Pool Pay" })).toBeVisible();
    await expect(page.getByText("Connect wallet to pool pay.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Connect Wallet" })).toBeVisible();
  });

  test("connect gate links back to the dashboard", async ({ page }) => {
    await page.goto("/pool-pay");
    await expect(page.getByRole("link", { name: /back to dashboard/i })).toBeVisible();
  });

  test("expired session surfaces the reconnect prompt", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "sharpy_wallet_connected",
        JSON.stringify({ address: "GD4Q2BH6KISIHTZWV5CSUMZC7VUBQAAXPNVSCESTUGH5WEYALMOTRS63", wallet: "freighter" })
      );
    });
    await page.goto("/pool-pay");
    await expect(page.getByText("Session expired.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reconnect" })).toBeVisible();
  });

  test("has no horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/pool-pay");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("connect button has an accessible name and is enabled", async ({ page }) => {
    await page.goto("/pool-pay");
    const connect = page.getByRole("button", { name: "Connect Wallet" });
    await expect(connect).toBeVisible();
    await expect(connect).toBeEnabled();
  });
});
