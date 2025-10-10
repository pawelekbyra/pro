import asyncio
from playwright.async_api import async_playwright, expect
import os
import re

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Ścieżka do pliku index.php
        file_path = os.path.abspath("ting-tong-theme/index.php")

        # Otwórz plik lokalny
        await page.goto(f"file://{file_path}")

        # Czekaj na załadowanie strony i upewnij się, że przycisk jest widoczny
        await page.wait_for_selector("#mockLoginBtn", state="visible")

        # Kliknij przycisk, aby pokazać modal
        await page.click("#mockLoginBtn")

        # Poczekaj, aż modal będzie widoczny
        modal_selector = "#firstLoginModal"
        await page.wait_for_selector(modal_selector, state="visible", timeout=5000)

        # Sprawdź, czy modal ma klasę 'visible'
        modal = page.locator(modal_selector)
        await expect(modal).to_have_class(re.compile(r'\bvisible\b'))

        # Daj chwilę na animację i renderowanie
        await page.wait_for_timeout(1000)

        # Zrób zrzut ekranu
        screenshot_path = "jules-scratch/verification/verification.png"
        await page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())