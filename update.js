import fs from "fs";
import puppeteer from "puppeteer";

const LANDING_URL = "https://www.snoco.org/RecordedDocuments";
const FINAL_URL =
  "https://www.snoco.org/RecordedDocuments/search/index?theme=.blue&section=searchCriteriaName&quickSearchSelection=";

async function fetchDate() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
  );

  try {
    console.log("Navigating to landing page...");
    await page.goto(LANDING_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    console.log("Clicking Name Search...");
    await page.waitForSelector('a[title="Name Search"]', { timeout: 20000 });
    await page.click('a[title="Name Search"]');

    console.log("Waiting for disclaimer...");
    await page.waitForSelector("#disclaimerAccept", { timeout: 20000 });
    await page.click("#disclaimerAccept");

    console.log("Waiting for redirect...");
    try {
      await page.waitForNavigation({
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
    } catch {
      console.log("Forced navigation to final page...");
      await page.goto(FINAL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    }

    console.log("Waiting for verification date...");
    await page.waitForSelector("#verificationDate", { timeout: 30000 });

    const text = await page.$eval("#verificationDate", el => el.innerText.trim());

    console.log("Raw verification date text:", text);

    const match = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/);

    if (!match) throw new Error("Could not extract date from verification date element");

    const verifiedDate = match[0];

    fs.writeFileSync(
      "date.json",
      JSON.stringify(
        {
          date: verifiedDate,
          source: FINAL_URL,
        },
        null,
        2
      )
    );

    console.log("✅ Saved verified-through date:", verifiedDate);
  } catch (err) {
    console.error("❌ Error:", err);
    await page.screenshot({ path: "debug.png", fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

fetchDate();
