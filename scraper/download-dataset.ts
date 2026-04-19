/**
 * Downloads an Apify dataset to raw/dataset.json
 * Usage: pnpm download <datasetId>
 */
import { writeFileSync, mkdirSync } from "fs";

const datasetId = process.argv[2];
if (!datasetId) {
  console.error("Usage: pnpm download <datasetId>");
  process.exit(1);
}

const token = process.env.APIFY_TOKEN;
if (!token) {
  console.error("APIFY_TOKEN not set");
  process.exit(1);
}

const url = `https://api.apify.com/v2/datasets/${datasetId}/items?format=json&limit=10000&token=${token}`;
console.log(`Downloading dataset ${datasetId}…`);

const res = await fetch(url);
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
mkdirSync("raw", { recursive: true });
writeFileSync("raw/dataset.json", JSON.stringify(data, null, 2), "utf-8");
console.log(`✅ Saved ${(data as unknown[]).length} items → raw/dataset.json`);
