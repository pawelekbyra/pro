import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Read the content of the index.php file
        with open('ting-tong-theme/index.php', 'r', encoding='utf-8') as f:
            html_content = f.read()

        # Set the content of the page directly
        await page.set_content(html_content)

        # Open the login panel
        await page.click('[data-action="toggle-login-panel"]')

        # Wait for the login panel to be visible
        login_panel = page.locator('.login-panel.active')
        await expect(login_panel).to_be_visible(timeout=5000)

        # Take a screenshot of the login form
        await page.locator('#tt-login-form').screenshot(path='jules-scratch/verification/login-form-with-eye-icon.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())