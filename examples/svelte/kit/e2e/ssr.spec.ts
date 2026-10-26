import { expect, test } from '@playwright/test'

test('server rendered requests start with isolated profile state', async ({ browser }) => {
  const first = await browser.newContext()
  const second = await browser.newContext()
  try {
    const firstPage = await first.newPage()
    const secondPage = await second.newPage()
    await Promise.all([firstPage.goto('/profile'), secondPage.goto('/profile')])
    await expect(firstPage.locator('.user-profile__info')).toContainText('Иван Иванов')
    await expect(secondPage.locator('.user-profile__info')).toContainText('Иван Иванов')
    await expect(firstPage).toHaveTitle('Профиль - FEOD Shop')
    await expect(secondPage).toHaveTitle('Профиль - FEOD Shop')
  } finally {
    await first.close()
    await second.close()
  }
})
