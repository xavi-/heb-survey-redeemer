import puppeteer from 'puppeteer';

async function next(page, idx) {
    await Promise.all([
        page.click("button[aria-label=Next]"),
        page.waitForNavigation({waitUntil: 'networkidle2'}),
        page.waitForSelector(`.i_${idx}`),
    ]);

    return sleep(1000);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function redeemReceipt(certificateCode, date) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://heb.com/survey");

    // Wait for suggest overlay to appear and click "show all results".
    const englishButton = ".menuItem-container .menuItem:first-child input";
    await page.waitForSelector(englishButton);
    await page.click(englishButton);

    await page.waitForSelector(".i_1");
    await page.type(".textInput input", certificateCode);

    await next(page, 2);
    await page.type(".dateInput[aria-label*=date]", "11/13/2022");
    await page.click(".menuItem:last-child input");

    await next(page, 3);
    await page.click(".menuItem:first-child input");

    await next(page, 4);
    await page.click(".option:last-child .rating");

    await next(page, 5);
    // Grocery department opinions
    for(let i = 1; i <= 7; i++) {
        let random = [ 1, 1, 1, 2, 2 ][(Math.random() * 5) | 0];
        await page.click(
            `.promptContainer:nth-child(${i + 1}) .option:nth-last-child(${random}) .rating`
        );
    }
    await page.click(`.promptContainer:nth-child(9) .option:nth-last-child(1) .rating`);
    await page.click(`.promptContainer:nth-child(10) .option:nth-last-child(1) .rating`);

    await next(page, 6);
    await page.click(".menuItem:first-child input");

    await next(page, 7);
    await page.click(".menuItem:last-child input");

    await next(page, 8);
    await page.click(`.menuItem:nth-child(${(3 * Math.random() + 1) | 0 }) input`);

    await next(page, 9);
    await page.click(".promptContainer:nth-child(2) .option:nth-last-child(2) .rating");
    await page.click(".promptContainer:nth-child(3) .option:nth-last-child(2) .rating");

    await next(page, 10);
    await page.click(".promptContainer:nth-child(2) .option:nth-last-child(1) .rating");
    await page.click(".promptContainer:nth-child(3) .option:nth-last-child(1) .rating");

    await next(page, 11);
    await page.click(".promptContainer:first-child .menuItem:last-child input");

    await next(page, 12);
    await page.click(".promptContainer:nth-child(2) .option:nth-last-child(1) .rating");
    await page.click(".promptContainer:nth-child(3) .option:nth-last-child(1) .rating");

    await next(page, 13);
    await page.click(".promptContainer:nth-child(1) .option:nth-last-child(2) .rating");

    await next(page, 14);
    await page.click(".menuItem:first-child input");

    await next(page, 15);
    await page.click(".promptContainer:nth-child(1) .menuItem:first-child input");
    await page.click(".promptContainer:nth-child(2) .menuItem:first-child input");
    await page.click(".promptContainer:nth-child(3) .menuItem:first-child input");

    await next(page, 16);
    await page.type(".promptContainer:nth-child(2) input", "Roberto");
    await page.type(".promptContainer:nth-child(3) input", "Ramirez");
    await page.type(".promptContainer:nth-child(4) input", "xavi.rmz@gmail.com");
    await page.type(".promptContainer:nth-child(5) input", "78758");
    await page.type(".promptContainer:nth-child(6) input", "956-358-8629");

    await next(page, 17);
    await page.click(".promptContainer:nth-child(1) .menuItem:nth-child(3) input");
    await page.click(".promptContainer:nth-child(2) .menuItem:nth-child(4) input");
    await page.click(".promptContainer:nth-child(3) .menuItem:nth-child(5) input");
    await page.click(".promptContainer:nth-child(4) .menuItem:nth-child(4) input");

    await next(page, 18);
    await page.screenshot({ path: `./completed-receipts/receipt-${certificateCode}.png` });
    await browser.close();
}
