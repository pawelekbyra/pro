import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Define mock responses
        mock_new_comment = {
            "id": "999",
            "user": "Test User",
            "avatar": "https://i.pravatar.cc/48?u=testuser",
            "text": "This is a test comment!",
            "timestamp": "2025-10-06T12:00:00Z",
            "likes": 0,
            "isLiked": False,
            "canEdit": True,
            "parentId": None,
            "new_comment_count": 1,
        }

        # Mock API responses
        def handle_route(route):
            request = route.request
            if "admin-ajax.php" in request.url:
                action = request.post_data_dict.get('action')
                if action == 'tt_get_comments':
                    print("Mocking tt_get_comments API call")
                    route.fulfill(status=200, json={"success": True, "data": []})
                    return
                if action == 'tt_post_comment':
                    print("Mocking tt_post_comment API call")
                    route.fulfill(status=200, json={"success": True, "data": mock_new_comment})
                    return

            route.continue_()

        page.route(re.compile("admin-ajax.php"), handle_route)

        # 1. Navigate to the app and select language
        print("Navigating to the application...")
        page.goto("http://localhost:8000/ting-tong-theme/")
        page.get_by_role("button", name="Polski").click()

        # Wait for the preloader to disappear
        expect(page.locator("#preloader")).to_be_hidden(timeout=10000)
        print("Preloader is hidden.")

        # 2. Set state to logged in
        page.evaluate("() => window.State.set('isUserLoggedIn', true)")
        print("Set user state to logged in.")

        # 3. Open the comments modal
        # Use the first comments button available
        comment_button = page.locator('[data-action="open-comments-modal"]').first
        expect(comment_button).to_be_visible()
        comment_button.click()
        print("Opened comments modal.")

        # 4. Verify the modal is open and the comment list is empty
        comments_modal = page.locator("#commentsModal")
        expect(comments_modal).to_be_visible()
        expect(comments_modal.get_by_text("Brak komentarzy. Bądź pierwszy!")).to_be_visible()
        print("Verified that the comment list is initially empty.")

        # 5. Add a new comment
        comment_input = page.locator("#comment-input")
        expect(comment_input).to_be_visible()
        comment_input.fill("This is a test comment!")

        submit_button = page.locator("#comment-form button[type='submit']")
        expect(submit_button).to_be_enabled()
        submit_button.click()
        print("Submitted a new comment.")

        # 6. Verify the new comment appears
        new_comment_text = page.get_by_text("This is a test comment!")
        expect(new_comment_text).to_be_visible(timeout=5000)
        print("Verified that the new comment is visible.")

        # 7. Take a screenshot
        screenshot_path = "jules-scratch/verification/verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)