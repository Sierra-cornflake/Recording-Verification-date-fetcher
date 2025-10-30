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
    await page.goto(URL, { waitUntil: "networkidle2" });

    // Wait for the element to load
    await page.waitForSelector("#cfnVerifiedThrough");

    // Extract the text content
    const dateText = await page.$eval(
      "#cfnVerifiedThrough .alert-info-grey",
      el => el.textContent
    );

    // Match a date in MM/DD/YYYY format
    const dateMatch = dateText.match(/\d{1,2}\/\d{1,2}\/\d{4}/);

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

    console.log("Verified-through date updated:", verifiedDate);
  } catch (err) {
    console.error("Error fetching date:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

fetchDate();
