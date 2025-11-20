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

  try {
    console.log("Navigating to landing page...");
    await page.goto(LANDING_URL, { waitUntil: "networkidle2", timeout: 60000 });

    // Click Name Search button
    console.log("Clicking Name Search...");
    await page.waitForSelector("#searchCategoryName", { timeout: 15000 });
    await page.click("#searchCategoryName");

    // Wait for disclaimer modal, click Accept
    console.log("Waiting for disclaimer...");
    await page.waitForSelector("#disclaimerAccept", { timeout: 15000 });
    await page.click("#disclaimerAccept");

    // Now wait for redirect to the search criteria page
    console.log("Waiting for redirect to final search screen...");
    await page.waitForNavigation({
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Ensure we are on the correct page
    const currentUrl = page.url();
    if (!currentUrl.includes("searchCriteriaName")) {
      console.warn("Did not land on expected URL, forcing navigation...");
      await page.goto(FINAL_URL, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });
    }

    // Wait for the verification date element
    console.log("Looking for verification date...");
    await page.waitForSelector("#verificationDate", { timeout: 15000 });

    const verifiedDate = await page.$eval("#verificationDate", el =>
      el.innerText.trim()
    );

    console.log("Extracted date text:", verifiedDate);

    // Extract date using regex
    const match = verifiedDate.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    if (!match) throw new Error("Could not extract date from text.");

    const dateString = match[0];

    // Write date.json
    const data = {
      date: dateString,
      source: FINAL_URL,
    };

    fs.writeFileSync("date.json", JSON.stringify(data, null, 2));
    console.log("✅ Saved verified-through date:", dateString);
  } catch (err) {
    console.error("❌ Error:", err);
    await page.screenshot({ path: "debug.png", fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

fetchDate();
