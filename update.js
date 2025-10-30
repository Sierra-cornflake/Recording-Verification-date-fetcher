import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { writeFileSync } from "fs";

const sourceUrl = "https://www.snoco.org/RecordedDocuments/search/index";

// Fetch the Snohomish County search page HTML
const html = await fetch(sourceUrl).then(res => res.text());

// Load into cheerio (like a jQuery parser)
const $ = cheerio.load(html);

// Find the date (pattern: MM/DD/YYYY) inside the "cfnVerifiedThrough" div
const dateMatch = $("#cfnVerifiedThrough").text().match(/\d{2}\/\d{2}\/\d{4}/);
const date = dateMatch ? dateMatch[0] : null;

if (!date) {
  console.error("❌ Could not find verification date on the page.");
  process.exit(1);
}

// Write the date.json file
writeFileSync(
  "date.json",
  JSON.stringify({ date, source: sourceUrl, updated: new Date().toISOString() }, null, 2)
);

console.log("✅ Updated date.json to:", date);
