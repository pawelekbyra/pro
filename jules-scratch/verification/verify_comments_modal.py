import re
from playwright.sync_api import sync_playwright, Page, expect

def verify_comments_modal(page: Page):
    """
    This script verifies the new comments modal functionality.
    1. Navigates to the local page.
    2. Clicks the comments button to open the modal.
    3. Asserts that the new UI elements (input, emoji btn, image btn) are visible.
    4. Takes a screenshot of the modal.
    """
    # 1. Navigate to the local server.
    page.goto("http://localhost:8000/jules-scratch/verification/index.html")

    # Give the app a moment to initialize its JavaScript
    page.wait_for_timeout(2000)

    # 2. Find and click the comments button on the first slide.
    # The slides are created dynamically, so we target the first one.
    comments_button = page.locator(".commentsButton").first
    expect(comments_button).to_be_visible()
    comments_button.click()

    # 3. Wait for the modal to be visible and perform assertions.
    comments_modal = page.locator("#commentsModal")
    expect(comments_modal).to_be_visible()

    # Assert that the new input field and attachment buttons are present
    comment_input = comments_modal.locator("#comment-input")
    expect(comment_input).to_be_visible()
    expect(comment_input).to_have_attribute("placeholder", "Dodaj komentarz...")

    emoji_btn = comments_modal.locator(".emoji-btn")
    expect(emoji_btn).to_be_visible()

    image_btn = comments_modal.locator(".image-btn")
    expect(image_btn).to_be_visible()

    # 4. Take a screenshot for visual verification.
    page.screenshot(path="jules-scratch/verification/comments_modal_verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_comments_modal(page)
        browser.close()

if __name__ == "__main__":
    main()