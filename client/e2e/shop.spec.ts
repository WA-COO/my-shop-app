import { test, expect } from '@playwright/test';

test.describe('Shopping Flow', () => {
    // Use a unique email for each test run to avoid conflict
    const userEmail = `e2e_${Date.now()}@example.com`;
    const userPass = 'password123';
    const userName = 'E2E User';

    test('User can register, view products, add to cart, and checkout', async ({ page }) => {
        // 1. Register a new user
        // Note: Using HashRouter, so we navigate to /#/login
        await page.goto('/#/login');

        // Check if page loaded
        await expect(page.getByText('歡迎回來')).toBeVisible();

        // Click the switch button using text locator with regex
        await page.getByText(/還沒有帳號/).click();

        await page.getByPlaceholder('Email address').fill(userEmail);
        await page.getByPlaceholder('Your Name').fill(userName);
        await page.getByPlaceholder('Password').fill(userPass);
        // Button text is "立即註冊"
        await page.getByRole('button', { name: '立即註冊' }).click();

        // Verify registration success (should redirect to home or show success)
        // Assuming redirect to home after login/register
        // HashRouter: /#/
        await expect(page).toHaveURL('/#/');

        // Check if user name is displayed in Navbar (inside dropdown)
        // We need to hover first to make it visible
        const userMenu = page.getByRole('button', { name: 'User menu' });
        await expect(userMenu).toBeVisible();
        await userMenu.hover();
        await expect(page.getByText(userName)).toBeVisible();

        // 2. Browse Products (Home Page)
        // Wait for products to load
        await expect(page.getByText('煥發自信光采')).toBeVisible();

        // Find the first "加入購物車" button and click it
        // Note: Depends on your ProductCard implementation. 
        // If buttons have specific ARIA labels or text, use that.
        const addToCartButtons = page.getByRole('button', { name: '加入購物車' });
        await expect(addToCartButtons.first()).toBeVisible();
        await addToCartButtons.first().click();

        // Verify cart count updated (assuming there is a badge)
        // await expect(page.getByText('1')).toBeVisible(); // This might optionally check badge

        // 3. Go to Cart
        await page.getByRole('link', { name: '購物車', exact: true }).click();
        // HashRouter: /#/cart
        await expect(page).toHaveURL('/#/cart');

        // Verify item is in cart
        await expect(page.getByText('結帳')).toBeVisible();

        // 4. Checkout
        await page.getByRole('button', { name: '前往結帳' }).click();
        // HashRouter: /#/checkout
        await expect(page).toHaveURL('/#/checkout');

        // Fill Shipping Info
        await page.getByRole('textbox', { name: '姓氏' }).fill('王');
        await page.getByRole('textbox', { name: '名字' }).fill(userName);
        await page.getByRole('textbox', { name: '電話號碼' }).fill('0912345678');
        await page.getByRole('textbox', { name: '詳細地址' }).fill('台北市信義區測試路100號');

        // Place Order
        await page.getByRole('button', { name: '確認付款' }).click();

        // 5. Verify Redirect to ECPay (or Order Success)
        // Since ECPay redirects to external site, we might just check if we left the checkout page
        // or if the URL contains 'payment' or if we see the ECPay form submission.
        // For this test, verifying we get the "訂單建立成功" alert or redirection is good.

        // Note: If ECPay form auto-submits, we will be redirected to ECPay test environment.
        // We can assume success if URL changes to a non-local one or payment gateway.
        await page.waitForTimeout(3000); // Wait for form submission

        // Ideally we check if we are on the payment gateway
        const currentUrl = page.url();
        // Check relative to base URL logic or just check it's NOT the checkout page
        expect(currentUrl).not.toContain('localhost:5173/#/checkout');
    });
});
