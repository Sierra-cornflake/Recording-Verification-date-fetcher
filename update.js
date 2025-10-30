import puppeteer from "puppeteer";
import { writeFileSync } from "fs";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to the records search page
  await page.goto("https://www.snoco.org/RecordedDocuments/search/index", { waitUntil: "networkidle2" });
  
  // Wait for the element that contains the date
  await page.waitForSelector("#cfnVerifiedThrough");

  // Extract the inner text
  const text = await page.$eval("#cfnVerifiedThrough", el => el.innerText);

  // Match the date (MM/DD/YYYY)
  const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
  const date = dateMatch ? dateMatch[0] : null;

  if (!date) throw new Error("❌ Could not find verification date on the page.");

  // Write date to JSON
  writeFileSync("date.json", JSON.stringify({ date }, null, 2));
  console.log("✅ Updated date:", date);

  await browser.close();
})();
