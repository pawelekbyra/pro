import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Otwórz stronę z lokalnego serwera
        await page.goto('http://localhost:8000/index.php')

        # Pokaż modal pierwszego logowania, dodając klasy 'visible'
        await page.evaluate('''() => {
            const modal = document.getElementById('firstLoginModal');
            if (modal) {
                modal.classList.add('visible');
            }
        }''')

        # Zaczekaj na animację
        await page.wait_for_timeout(500)

        # Zrób zrzut ekranu
        await page.screenshot(path='jules-scratch/verification/verification.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())