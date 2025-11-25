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

    console.log("Waiting for Accept modal...");
    await page.waitForSelector("#idAcceptYes", { timeout: 20000 });

    console.log("Clicking Accept...");
    await page.click("#idAcceptYes");

    console.log("Waiting for redirect...");
    await page.waitForFunction(
      () => window.location.href.includes("/search/index"),
      { timeout: 20000 }
    ).catch(async () => {
      console.log("Redirect failed — manually loading final page...");
      await page.goto(FINAL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    });

    console.log("Waiting for verification date element...");
    await page.waitForSelector("#verificationDate", { timeout: 30000 });

    const rawText = await page.$eval("#verificationDate", el => el.innerText.trim());
    console.log("Raw text:", rawText);

    const match = rawText.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    if (!match) throw new Error("Could not extract date");

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
