import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        # Launch the browser with the flag to allow local file access
        browser = await p.chromium.launch(args=["--allow-file-access-from-files"])
        page = await browser.new_page()

        # Get the absolute path to the index.php file
        file_path = os.path.abspath("ting-tong-theme/index.php")

        # Navigate to the local file
        await page.goto(f"file://{file_path}")

        # Click the language button to start the app
        await page.locator('button[data-lang="en"]').click()

        # Wait for the mock button to be visible to ensure the app has loaded
        await expect(page.locator("#mock-first-login-btn")).to_be_visible(timeout=10000)

        # Click the mock button to trigger the modal
        await page.locator("#mock-first-login-btn").click()

        # Wait for the modal to be visible
        modal = page.locator("#firstLoginModal")
        await expect(modal).to_be_visible()

        # Give animations time to finish
        await page.wait_for_timeout(500)

        # Take a screenshot of the modal
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())