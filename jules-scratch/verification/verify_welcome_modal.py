from playwright.sync_api import sync_playwright, Page, expect

def verify_welcome_modal(page: Page):
    """
    This test verifies that the welcome modal appears on page load
    in a browser context and can be closed.
    """
    # 1. Arrange: Go to the application's homepage.
    page.goto("http://localhost:8088")

    # DEBUG: Take a screenshot right after loading to see the initial state.
    page.screenshot(path="jules-scratch/verification/debug_initial_load.png")
    print("Debug screenshot saved to jules-scratch/verification/debug_initial_load.png")

    # 2. Act: Select the Polish language to start the app.
    # This simulates the user's first action.
    polish_button = page.get_by_role("button", name="Polski")
    expect(polish_button).to_be_visible(timeout=10000)
    polish_button.click()

    # 3. Assert: Check if the welcome modal is visible.
    # We use a specific ID to locate the modal.
    welcome_modal = page.locator("#welcome-modal")
    expect(welcome_modal).to_be_visible(timeout=5000)

    # 4. Assert: Check the content of the modal.
    expect(welcome_modal.get_by_role("heading", name="Witaj w Ting Tong!")).to_be_visible()
    expect(welcome_modal.get_by_text("To aplikacja napiwkowa, stworzona, by wspierać moją twórczość.")).to_be_visible()

    # 5. Screenshot: Capture the state with the modal open.
    screenshot_path = "jules-scratch/verification/verification.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

    # 6. Act: Click the "OK" button to close the modal.
    ok_button = welcome_modal.get_by_role("button", name="OK")
    ok_button.click()

    # 7. Assert: The modal should no longer be visible.
    expect(welcome_modal).not_to_be_visible()

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_welcome_modal(page)
            print("Verification script ran successfully!")
        except Exception as e:
            print(f"An error occurred: {e}")
            # DEBUG: Take a screenshot on failure
            page.screenshot(path="jules-scratch/verification/debug_failure.png")
            print("Debug screenshot on failure saved to jules-scratch/verification/debug_failure.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()