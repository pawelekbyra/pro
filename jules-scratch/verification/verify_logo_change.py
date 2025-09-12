import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')

        # Go to the local HTML file
        await page.goto(f'file://{file_path}')

        # Click the Polish language button to start the app
        await page.locator('button[data-lang="pl"]').click()

        # Wait for the preloader to disappear
        await expect(page.locator('#preloader')).not_to_be_visible(timeout=10000)

        # Simulate logging in to see the logo
        await page.locator('[data-action="toggle-login-panel"]').click()
        await page.locator('#tt-username').fill('test')
        await page.locator('#tt-password').fill('test')
        await page.locator('#tt-login-submit').click()

        # Wait for the logo to be visible by checking for the img tag in the topbar
        logo = page.locator('.topbar-text .topbar-logo-img')
        await expect(logo).to_be_visible(timeout=5000)

        # Take a screenshot of the top bar
        await page.locator('.topbar').screenshot(path='jules-scratch/verification/verification.png')

        await browser.close()

asyncio.run(main())
