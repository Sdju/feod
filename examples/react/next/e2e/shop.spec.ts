import { expect, test } from "@playwright/test";

test("SSR route output includes the catalog before browser hydration", async ({ request }) => {
  const response = await request.get("/catalog");
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain("Каталог продуктов");
  expect(html).toContain("Продукт 1");
  expect(html).toContain("Каталог - FEOD Shop");
});

test("cart quantity, removal, total and clear stay shared across App Router navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("link", { name: "Каталог", exact: true }).click();
  const product = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Продукт 1" }) });
  await product.getByRole("button", { name: "В корзину", exact: true }).click();
  await expect(page.locator(".cart-widget__total")).toHaveText("1000 ₽");
  await expect(page.locator(".cart-widget__counter")).toHaveText("1");
  await page.getByRole("link", { name: "Открыть корзину" }).click();
  const item = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Продукт 1" }) });
  await expect(page.locator(".cart-summary__total")).toContainText("1000 ₽");
  await item.getByRole("button", { name: "Увеличить количество товара Продукт 1" }).click();
  await expect(page.locator(".cart-summary__total")).toContainText("2000 ₽");
  await item.getByRole("button", { name: "Уменьшить количество товара Продукт 1" }).click();
  await item.getByRole("button", { name: "Удалить Продукт 1 из корзины" }).click();
  await expect(page.getByText("Ваша корзина пуста", { exact: true })).toBeVisible();
  await expect(page.locator(".cart-widget__total")).toHaveText("0 ₽");

  await page.getByRole("link", { name: "Каталог", exact: true }).click();
  const secondProduct = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Продукт 2", exact: true }) });
  await secondProduct.getByRole("button", { name: "В корзину", exact: true }).click();
  await page.getByRole("link", { name: "Открыть корзину" }).click();
  await expect(page.locator(".cart-summary__total")).toContainText("2000 ₽");
  await page.getByRole("button", { name: "Оформить заказ", exact: true }).click();
  await expect(page.getByText("Ваша корзина пуста", { exact: true })).toBeVisible();
  await expect(page.locator(".cart-widget__total")).toHaveText("0 ₽");
  await expect(page.locator(".cart-widget__counter")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("profile edits save across widgets and cancel without changing shared state", async ({ page }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  await page.getByLabel("Имя").fill("Анна Петрова");
  await page.getByLabel("Email").fill("anna@example.com");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(page.locator(".user-widget__name")).toHaveText("Анна Петрова");
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  await page.getByLabel("Имя").fill("Черновик");
  await page.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(page.locator(".user-widget__name")).toHaveText("Анна Петрова");
});

test("390px layout has no horizontal overflow and all deep links retain their titles", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, heading, title] of [
    ["/", "Добро пожаловать в FEOD Shop", "Главная - FEOD Shop"],
    ["/catalog", "Каталог продуктов", "Каталог - FEOD Shop"],
    ["/cart", "Корзина", "Корзина - FEOD Shop"],
    ["/profile", "Профиль", "Профиль - FEOD Shop"],
    ["/about", "О FEOD Shop", "О проекте - FEOD Shop"],
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page).toHaveTitle(title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
  const historyPage = await page.context().newPage();
  await historyPage.goto("/catalog");
  await historyPage.getByRole("link", { name: "Корзина", exact: true }).click();
  await expect(historyPage.getByRole("heading", { name: "Корзина" })).toBeVisible();
  await historyPage.goBack();
  await expect(historyPage.getByRole("heading", { name: "Каталог продуктов" })).toBeVisible();
  await historyPage.goForward();
  await expect(historyPage.getByRole("heading", { name: "Корзина" })).toBeVisible();
  await historyPage.close();
  await page.goto("/not-a-route");
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("product route resolves params, metadata and 404 on the server", async ({ page, request }) => {
  const html = await (await request.get("/catalog/2")).text();
  expect(html).toContain("Продукт 2 - FEOD Shop");
  expect(html).toContain("Описание продукта 2");
  expect((await request.get("/catalog/999")).status()).toBe(404);

  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/catalog");
  await expect(page.getByRole("link", { name: "Каталог", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Продукт 2", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog\/2$/);
  await expect(page).toHaveTitle("Продукт 2 - FEOD Shop");
  await expect(page.getByRole("link", { name: "Каталог", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "В корзину", exact: true }).click();
  await expect(page.getByRole("button", { name: "В корзине", exact: true })).toBeDisabled();
  await expect(page.locator(".cart-widget__total")).toHaveText("2000 ₽");
  await page.getByRole("link", { name: "← Вернуться в каталог" }).click();
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Продукт 2", exact: true }) });
  await expect(card.getByRole("button", { name: "В корзине", exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});
