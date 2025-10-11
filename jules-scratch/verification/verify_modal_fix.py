import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Przejdź do lokalnego pliku index.php
        file_path = "file://" + os.path.abspath("ting-tong-theme/index.php")
        await page.goto(file_path)

        # Kliknij przycisk, aby pokazać modal (zidentyfikowany w kodzie)
        await page.click("#mockLoginBtn")

        # Czekaj na pojawienie się modala
        modal = page.locator("#firstLoginModal")
        await expect(modal).to_be_visible()

        # Zrób zrzut ekranu
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())