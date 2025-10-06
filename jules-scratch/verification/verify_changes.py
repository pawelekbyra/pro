from playwright.sync_api import sync_playwright, expect
import os

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the simple verification file
        page.goto(f"file://{os.getcwd()}/jules-scratch/verification/simple_verify.html", timeout=60000)

        # Verify that the button is visible
        mock_modal_button = page.locator("#mock-first-login-btn")
        expect(mock_modal_button).to_be_visible()

        # Take a screenshot to confirm the button's position
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot taken for button position verification.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run_verification(playwright)