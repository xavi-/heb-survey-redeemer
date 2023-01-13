import http from "http";

import * as bee from "beeline";
import puppeteer from 'puppeteer';

const router = bee.route({
    "/": bee.staticFile("./frontend/index.html", "text/html"),
    "/redeem": {
        POST: async (req, res) => {
            const body = [];
            req.on("data", chunk => body.push(chunk.toString()));
            req.on("end", async () => {
                const { certificate_code, date, cashier } = JSON.parse(body.join(""));
                console.log(
                    `certificate_code: ${certificate_code}, date: ${date}, cashier: ${cashier}`
                );
                try {
                    await redeemReceipt(certificate_code, new Date(date), cashier);
                    res.end(JSON.stringify({ certificate_code, date, cashier }));
                } catch(err) {
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
        }
    }
});
console.log("Listening on port 8001...");
http.createServer(router).listen(8001);

async function next(page, idx) {
    await Promise.all([
        page.click("button[aria-label=Next]"),
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        page.waitForSelector(`.i_${idx}`),
    ]);

    return sleep(Math.random() * 1000 + 500);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function finishSurvey(certificateCode, page, idx) {
    await next(page, idx + 0); // Leave a comment
    await page.click(".menuItem:first-child input");

    await next(page, idx + 1);
    await page.click(".promptContainer:nth-child(1) .menuItem:first-child input");
    await page.click(".promptContainer:nth-child(2) .menuItem:first-child input");
    await page.click(".promptContainer:nth-child(3) .menuItem:first-child input");

    await next(page, idx + 2);
    await page.type(".promptContainer:nth-child(2) input", "Roberto");
    await page.type(".promptContainer:nth-child(3) input", "Ramirez");
    await page.type(".promptContainer:nth-child(4) input", "xavi.rmz@gmail.com");
    await page.type(".promptContainer:nth-child(5) input", "78758");
    await page.type(".promptContainer:nth-child(6) input", "956-358-8629");

    await next(page, idx + 3);
    await page.click(".promptContainer:nth-child(1) .menuItem:nth-child(3) input");
    await page.click(".promptContainer:nth-child(2) .menuItem:nth-child(4) input");
    await page.click(".promptContainer:nth-child(3) .menuItem:nth-child(5) input");
    await page.click(".promptContainer:nth-child(4) .menuItem:nth-child(4) input");

    await next(page, idx + 4);
    await page.screenshot({ path: `./completed-receipts/receipt-${certificateCode}.png` });
}

async function redeemReceipt(certificateCode, date, cashier) {
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
    await page.type(".dateInput[aria-label*=date]", date.toLocaleDateString());
    await page.click(".menuItem:last-child input");

    await next(page, 3);
    if (await page.$(".textInput input") != null) {
        await page.type(".textInput input", cashier)
    } else {
        await page.click(".menuItem:first-child input");
    }

    await next(page, 4);
    await page.click(".option:last-child .rating");

    await next(page, 5);
    const sections = (await page.$$(".promptContainer:has(.option .rating)")).length;
    if(sections <= 2) {
        await page.click(`.promptContainer:nth-child(1) .option:nth-last-child(1) .rating`);
        await page.click(`.promptContainer:nth-child(2) .option:nth-last-child(1) .rating`);
    } else {
        // Grocery department opinions
        for(let i = 1; i <= 7; i++) {
            let random = [ 1, 1, 1, 2, 2 ][(Math.random() * 5) | 0];
            await page.click(
                `.promptContainer:nth-child(${i + 1}) .option:nth-last-child(${random}) .rating`
            );
        }
        await page.click(`.promptContainer:nth-child(9) .option:nth-last-child(1) .rating`);
        await page.click(`.promptContainer:nth-child(10) .option:nth-last-child(1) .rating`);
    }

    await next(page, 6);
    await page.click(".menuItem:first-child input");

    await next(page, 7);
    await page.click(".menuItem:first-child input");

    await next(page, 8);
    if (await page.$(".promptContainer:has(.option .rating)") != null) { // Paid with cash
        await page.click(".promptContainer .option:nth-last-child(1) .rating");

        await finishSurvey(certificateCode, page, 9);
    } else { // Paid with card
        await page.click(`.menuItem:nth-child(${(2 * Math.random() + 1) | 0 }) input`);

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

        // Sign up for HEB gift card
        await finishSurvey(certificateCode, page, 14);
    }

    await browser.close();
}
