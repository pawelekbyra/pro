import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Construct the absolute file path
        file_path = "file://" + os.path.abspath("index.html")
        await page.goto(file_path)

        # Start the app by selecting a language
        await page.locator('button[data-lang="pl"]').click()

        # Use a hardcoded wait to ensure all animations and scripts have completed
        await page.wait_for_timeout(5000)

        # Now that the app should be ready, click the comments button
        comments_button = page.locator('.swiper-slide-active .commentsButton')
        await expect(comments_button).to_be_visible()
        await comments_button.click()

        # Wait for the modal to be visible
        comments_modal = page.locator("#commentsModal")
        await expect(comments_modal).to_be_visible(timeout=2000)

        # Wait for comments to be rendered and verify the edit/delete buttons
        first_comment = comments_modal.locator(".comment-item").first
        await expect(first_comment.locator('[data-action="edit-comment"]')).to_be_visible()
        await expect(first_comment.locator('[data-action="delete-comment"]')).to_be_visible()

        # Take a screenshot
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

asyncio.run(main())