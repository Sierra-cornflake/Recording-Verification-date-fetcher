import fs from "fs";
import puppeteer from "puppeteer";

const LANDING_URL = "https://www.snoco.org/RecordedDocuments";
const FINAL_URL =
  "https://www.snoco.org/RecordedDocuments/search/index?theme=.blue&section=searchCriteriaName&quickSearchSelection=";

async function fetchDate() {
  const browser = await puppeteer.launch({
    headless: true, // safer and lighter
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Polite, descriptive user-agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36 (YourWorkflowBot/1.0)"
  );

  try {
    console.log("Navigating to landing page...");
    await page.goto(LANDING_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Polite wait
    await page.waitForTimeout(1500);

    console.log("Clicking Name Search...");
    await page.waitForSelector('a[title="Name Search"]', { timeout: 20000 });
    await page.click('a[title="Name Search"]');

    await page.waitForTimeout(1500);

    console.log("Waiting for Accept modal...");
    await page.waitForSelector("#idAcceptYes", { timeout: 20000 });
    await page.click("#idAcceptYes");

    await page.waitForTimeout(1500);

    console.log("Waiting for page redirect after Accept...");
    await page.waitForFunction(
      () => window.location.href.includes("https://www.snoco.org/RecordedDocuments/search/index"),
      { timeout: 20000 }
    ).catch(async () => {
      console.log("Redirect did not happen — manually navigating...");
      await page.goto(FINAL_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    });

    await page.waitForTimeout(1500);

    console.log("Waiting for verification date element...");
    await page.waitForSelector("#cfnVerifiedThrough", { timeout: 30000 });

    const rawText = await page.$eval(
      "#cfnVerifiedThrough",
      el => el.innerText.replace(/\s+/g, " ").trim()
    );
    console.log("Raw text:", rawText);

    const match = rawText.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    if (!match) throw new Error("Could not extract date");

    const verifiedDate = match[0];

    // Save to JSON and JS for your site
    fs.writeFileSync(
      "date.json",
      JSON.stringify({ date: verifiedDate, source: FINAL_URL }, null, 2)
    );

    fs.writeFileSync(
      "date.js",
      `window.updateVerifiedDate(${JSON.stringify({ date: verifiedDate })});`
    );

    console.log("✅ Saved verified-through date:", verifiedDate);

  } catch (err) {
    console.error("❌ Error:", err);

    // Only take screenshot if something actually went wrong
    await page.screenshot({ path: "debug.png", fullPage: true });

    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the safe fetch
fetchDate();
