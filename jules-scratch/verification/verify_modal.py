import asyncio
from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Get the absolute path to the index.php file
    file_path = os.path.abspath("ting-tong-theme/index.php")

    # Go to the local file
    page.goto(f"file://{file_path}")

    # The mock button is initially hidden, so we need to make it visible
    page.evaluate("() => { document.getElementById('mockLoginBtn').style.display = 'block'; }")

    # Click the mock login button to trigger the modal
    page.click("#mockLoginBtn")

    # Wait for the modal to become visible
    modal = page.locator("#firstLoginModal")
    expect(modal).to_be_visible()

    # Wait for the animation to complete
    page.wait_for_timeout(500)

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)