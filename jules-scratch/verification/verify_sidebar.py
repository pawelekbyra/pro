import asyncio
import re
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Listen for console errors and messages
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGEERROR: {err}"))

        # Navigate to the local server
        await page.goto("http://localhost:8000/jules-scratch/verification/index.html", wait_until="networkidle")

        # Click the Polish language button to start the app
        await page.locator('button[data-lang="pl"]').click()

        # Wait for the main container to be visible and ready
        await expect(page.locator("#webyx-container")).to_be_visible(timeout=10000)
        await expect(page.locator("#webyx-container")).to_have_class(re.compile(r"\bready\b"), timeout=5000)

        # Wait for the first slide and video to be loaded
        await expect(page.locator(".swiper-slide-active .player")).to_be_visible(timeout=10000)

        # Wait a bit longer for all UI elements to settle, especially the sidebar
        await page.wait_for_timeout(2000)

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

asyncio.run(main())