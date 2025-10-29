import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Construct the absolute file path
        file_path = os.path.abspath('jules-scratch/verification/verify.html')

        await page.goto(f'file://{file_path}')

        # Wait for the modal to become visible (added via JS setTimeout)
        await page.wait_for_selector('#commentsModal.visible')

        await page.screenshot(path='jules-scratch/verification/verification.png')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
