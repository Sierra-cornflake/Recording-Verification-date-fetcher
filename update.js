import fs from "fs";
import puppeteer from "puppeteer";

const URL = "https://www.snoco.org/RecordedDocuments/search/index";

async function fetchDate() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    console.log("Navigating to SnoCo page...");
    await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });

    // Give the page some extra time for dynamic scripts to run
    await page.waitForTimeout(10000);

    console.log("Looking for the verified-through section...");

    // Get all text content from the body and look for a date pattern
    const bodyText = await page.evaluate(() => document.body.innerText);
    const dateMatch = bodyText.match(/\d{1,2}\/\d{1,2}\/\d{4}/);

    if (!dateMatch) {
      throw new Error("Could not find verification date on the page.");
    }

    const verifiedDate = dateMatch[0];

    // Write to date.json
    const data = {
      date: verifiedDate,
      source: URL
    };
    fs.writeFileSync("date.json", JSON.stringify(data, null, 2));

    console.log("✅ Verified-through date updated:", verifiedDate);
  } catch (err) {
    console.error("❌ Error fetching date:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

fetchDate();
