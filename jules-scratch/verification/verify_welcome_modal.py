import re
from playwright.sync_api import sync_playwright, expect

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the static HTML file on the local server
        page.goto("http://localhost:8000/index.html")

        # Click the Polish language button to start the app
        page.locator('button[data-lang="pl"]').click()

        # Wait for the welcome modal to be visible
        welcome_modal = page.locator("#welcome-modal")
        expect(welcome_modal).to_be_visible()

        # The modal has a slide-up animation, wait for it to finish
        # We can check for the 'visible' class and the animation to be stable
        expect(welcome_modal).to_have_class(re.compile(r"\bvisible\b"))

        # Additional wait to ensure all animations and dynamic elements have settled
        page.wait_for_timeout(1000)

        # Take a screenshot of the modal
        welcome_modal_content = page.locator(".welcome-modal-content")
        screenshot_path = "jules-scratch/verification/welcome_modal_screenshot.png"
        welcome_modal_content.screenshot(path=screenshot_path)

        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_verification()