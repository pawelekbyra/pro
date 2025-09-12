import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto('http://localhost:8000/index.html')

        # Click the language button to start the app
        await page.locator('button[data-lang="pl"]').click()

        # Wait for the preloader to disappear
        await expect(page.locator('#preloader')).not_to_be_visible(timeout=10000)

        # The 'info' button click now toggles the login state
        info_button = page.locator('.swiper-slide-active button[data-action="open-info-modal"]')
        await info_button.click()


        # Wait for the logo to be visible
        logo_locator = page.locator('.topbar-logo')
        await expect(logo_locator).to_be_visible(timeout=5000)

        # Take a screenshot of the top bar area
        top_bar_locator = page.locator('.topbar')
        await top_bar_locator.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

asyncio.run(main())
