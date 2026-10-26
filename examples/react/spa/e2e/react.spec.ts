import { test, expect } from "@playwright/test";

test("catalog and cart work together through module public APIs", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Добро пожаловать в FEOD Shop" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Каталог", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Каталог продуктов" })).toBeVisible();

  const product = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Продукт 1", exact: true }) });
  await product.getByRole("button", { name: "В корзину", exact: true }).click();
  await expect(product.getByRole("button", { name: "В корзине", exact: true })).toBeDisabled();
  await expect(page.locator(".cart-widget__total")).toHaveText("1000 ₽");
  await expect(page.locator(".cart-widget__counter")).toHaveText("1");
  await page.getByRole("button", { name: "Открыть корзину" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Корзина", exact: true })).toBeVisible();

  const item = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Продукт 1", exact: true }) });
  const total = page.locator(".cart-summary__total");
  await expect(total).toContainText("1000 ₽");
  await item.getByRole("button", { name: "+", exact: true }).click();
  await expect(total).toContainText("2000 ₽");
  await expect(page.locator(".cart-widget__counter")).toHaveText("2");
  await item.getByRole("button", { name: "-", exact: true }).click();
  await expect(total).toContainText("1000 ₽");

  await page.getByRole("button", { name: "Оформить заказ" }).click();
  await expect(page.getByText("Ваша корзина пуста", { exact: true })).toBeVisible();
  await expect(page.locator(".cart-widget__total")).toHaveText("0 ₽");
  await expect(page.locator(".cart-widget__counter")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("profile fields have labels and saving or cancelling updates the shared user state", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/profile");
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  await page.getByLabel("Имя", { exact: true }).fill("Анна Петрова");
  await page.getByLabel("Email", { exact: true }).fill("anna@example.com");
  await page.getByLabel("Телефон", { exact: true }).fill("+7 900 000-00-00");
  await page.getByLabel("Адрес", { exact: true }).fill("Санкт-Петербург");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();

  const profile = page.locator(".user-profile__info");
  await expect(profile).toContainText("Анна Петрова");
  await expect(profile).toContainText("anna@example.com");
  await expect(profile).toContainText("+7 900 000-00-00");
  await expect(profile).toContainText("Санкт-Петербург");
  await expect(page.locator(".user-widget__name")).toHaveText("Анна Петрова");

  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  await page.getByLabel("Имя", { exact: true }).fill("Несохранённое имя");
  await page.getByRole("button", { name: "Отмена", exact: true }).click();
  await expect(page.locator(".user-widget__name")).toHaveText("Анна Петрова");
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  await expect(page.getByLabel("Имя", { exact: true })).toHaveValue("Анна Петрова");
  expect(pageErrors).toEqual([]);
});

test("mobile navigation and cart stay within a 390px viewport", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });

  async function expectNoHorizontalOverflow() {
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
      .toBeLessThanOrEqual(1);
  }

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Добро пожаловать в FEOD Shop" }),
  ).toBeVisible();
  await expectNoHorizontalOverflow();
  await page.getByRole("link", { name: "Каталог", exact: true }).click();
  const product = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Продукт 1", exact: true }) });
  await expect(product).toBeVisible();
  await expectNoHorizontalOverflow();
  await product.getByRole("button", { name: "В корзину", exact: true }).click();
  await page.getByRole("button", { name: "Открыть корзину" }).click();
  const item = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Продукт 1", exact: true }) });
  await expect(item).toBeVisible();
  await expectNoHorizontalOverflow();
  await item.getByRole("button", { name: "+", exact: true }).click();
  await expect(page.locator(".cart-summary__total")).toContainText("2000 ₽");
  await item.getByRole("button", { name: "Удалить", exact: true }).click();
  await expect(page.getByText("Ваша корзина пуста", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow();

  await page.locator(".user-widget").click();
  await expect(page.getByRole("heading", { name: "Профиль", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow();
  await page.getByRole("button", { name: "Редактировать", exact: true }).click();
  await expect(page.getByLabel("Имя", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow();
  await page.getByRole("link", { name: "О проекте", exact: true }).click();
  await expect(page.getByRole("heading", { name: "О FEOD Shop", exact: true })).toBeVisible();
  await expectNoHorizontalOverflow();
  expect(pageErrors).toEqual([]);
});

test("direct routes and browser history preserve module state", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/catalog");
  await expect(page).toHaveTitle("Каталог - FEOD Shop");
  await expect(page.getByRole("heading", { name: "Каталог продуктов" })).toBeVisible();
  const product = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Продукт 2", exact: true }) });
  await product.getByRole("button", { name: "В корзину", exact: true }).click();
  await page.getByRole("button", { name: "Открыть корзину" }).click();
  await expect(page.getByRole("heading", { name: "Корзина", exact: true })).toBeVisible();
  await page.goBack();
  await expect(product.getByRole("button", { name: "В корзине", exact: true })).toBeDisabled();
  await page.goForward();
  await expect(page.locator(".cart-summary__total")).toContainText("2000 ₽");
  const item = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: "Продукт 2", exact: true }) });
  await item.getByRole("button", { name: "-", exact: true }).click();
  await expect(page.getByText("Ваша корзина пуста", { exact: true })).toBeVisible();
  await page.goto("/missing");
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  await page.getByRole("link", { name: "На главную", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Добро пожаловать в FEOD Shop" })).toBeVisible();
  expect(errors).toEqual([]);
});
