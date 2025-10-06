import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 414, 'height': 896},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
    )
    page = context.new_page()

    try:
        page.goto("http://localhost:8080/")

        # Forcefully hide the preloader as the app logic doesn't run in static mode
        page.evaluate("document.getElementById('preloader').style.display = 'none'")

        # Show the main view and take a screenshot
        page.screenshot(path="jules-scratch/verification/01_main_view.png")

        # --- Verify Welcome Modal ---
        # Forcefully show the welcome modal
        page.evaluate("document.getElementById('welcome-modal').classList.add('visible')")
        expect(page.locator("#welcome-modal")).to_be_visible()
        page.wait_for_timeout(500) # Wait for animation
        page.screenshot(path="jules-scratch/verification/02_welcome_modal.png")
        # Hide it again
        page.evaluate("document.getElementById('welcome-modal').classList.remove('visible')")
        page.wait_for_timeout(500) # Wait for hide animation

        # --- Verify Comments Modal ---
        # Forcefully show the comments modal
        page.evaluate("document.getElementById('commentsModal').classList.add('visible')")
        expect(page.locator("#commentsModal")).to_be_visible()
        # Ensure the slide-in animation is complete
        expect(page.locator("#commentsModal .modal-content")).to_have_css("transform", "matrix(1, 0, 0, 1, 0, 0)")
        page.wait_for_timeout(500) # Wait for animation
        page.screenshot(path="jules-scratch/verification/03_comments_modal.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)