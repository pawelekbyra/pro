import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Get the absolute path to the index.php file
        # The script is run from the root, so the path is relative to the root
        file_path = os.path.abspath("ting-tong-theme/index.php")

        # Go to the local file
        await page.goto(f"file://{file_path}")

        # Wait for the preloader to disappear to make sure the page is ready
        await page.wait_for_selector("#preloader", state="hidden", timeout=10000)

        # Find the "Napiwek" button and click it to open the modal
        # We need to find the button within the slide template as it's dynamically added
        # A more robust way is to find a generic tip button if one exists
        tip_button_selector = '[data-action="show-tip-jar"]'
        await page.wait_for_selector(tip_button_selector, state="visible")

        # Since there might be multiple such buttons, we click the first visible one
        await page.locator(tip_button_selector).first.click()

        # Wait for the modal to be visible
        modal_selector = "#tippingModal"
        await page.wait_for_selector(modal_selector, state="visible")

        # --- Step 1: Initial state ---
        await asyncio.sleep(1) # Wait for animation
        await page.screenshot(path="jules-scratch/verification/verification_step1.png")

        # --- Step 2: Click "Dalej" ---
        await page.locator("#tippingNextBtn").click()
        await asyncio.sleep(1) # Wait for animation
        await page.screenshot(path="jules-scratch/verification/verification_step2.png")

        # --- Step 3: Enter amount and click "Przejdź do płatności" ---
        await page.locator("#tippingAmount").fill("10")
        await page.locator("#tippingSubmitBtn").click()
        await asyncio.sleep(1) # Wait for animation
        await page.screenshot(path="jules-scratch/verification/verification_step3.png")

        # Final screenshot of the last step
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())