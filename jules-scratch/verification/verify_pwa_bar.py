import asyncio
from playwright.async_api import async_playwright, expect
import re

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listener dla standardowej konsoli
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.type.upper()} - {msg.text}"))
        # Listener dla nieobsłużonych błędów na stronie (np. unhandled promise rejections)
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: Unhandled exception: {exc}"))

        try:
            # Przejdź do strony testowej
            await page.goto("http://localhost:8000/jules-scratch/verification/index.html", timeout=15000)

            # Krok 1: Kliknij przycisk wyboru języka
            lang_button = page.locator('button[data-lang="pl"]')
            await expect(lang_button).to_be_visible(timeout=5000)
            await lang_button.click()

            # Krok 2: Poczekaj, aż preloader zacznie znikać
            await expect(page.locator("#preloader")).to_have_class(re.compile(r"preloader-hiding"), timeout=10000)

            # Krok 3: Znajdź pasek instalacji PWA i sprawdź jego widoczność
            install_bar = page.locator("#pwa-install-bar")
            await expect(install_bar).to_be_visible(timeout=5000)
            await expect(install_bar).to_have_class(re.compile(r"\bvisible\b"))

            # Zrób zrzut ekranu
            screenshot_path = "jules-scratch/verification/verification.png"
            await page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred during Playwright script execution: {e}")
            await page.screenshot(path="jules-scratch/verification/error_screenshot.png")
            print("Error screenshot saved to jules-scratch/verification/error_screenshot.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())