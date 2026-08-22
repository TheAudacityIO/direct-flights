import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots/qa", { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
  ],
});

const viewports = [
  { name: "desktop", width: 1280, height: 800, minMapH: 500 },
  { name: "preview", width: 720, height: 640, minMapH: 160 },
  { name: "mobile", width: 390, height: 844, minMapH: 180 },
];

const report = [];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `/workspace/screenshots/qa/${vp.name}-home.png` });

  await page.getByRole("button", { name: /CAG/ }).click();
  await page.waitForFunction(
    () => document.body.innerText.includes("nonstop destinations"),
    { timeout: 10000 },
  );
  await page.waitForTimeout(3000);

  const afterCag = await page.evaluate((minMapH) => {
    const canvas = document.querySelector("canvas");
    const mapEl = document.querySelector(".maplibregl-map");
    const destBtns = [...document.querySelectorAll("button")].filter(
      (b) => /^[A-Z]{3}/.test(b.innerText) && b.offsetParent !== null && b.innerText.includes("km"),
    );
    return {
      url: location.href,
      canvasCss: canvas
        ? { w: canvas.clientWidth, h: canvas.clientHeight }
        : null,
      mapBox: mapEl
        ? { w: mapEl.clientWidth, h: mapEl.clientHeight }
        : null,
      mapOk: Boolean(
        canvas &&
          canvas.clientWidth > 200 &&
          (mapEl?.clientHeight ?? canvas.clientHeight) >= minMapH,
      ),
      destVisible: destBtns.slice(0, 6).map((b) => b.innerText.split("\n")[0]),
      destCountVisible: destBtns.length,
      logoLabel: Boolean(
        document.querySelector("button[aria-label='Show all routes on the map']"),
      ),
    };
  }, vp.minMapH);
  await page.screenshot({ path: `/workspace/screenshots/qa/${vp.name}-cag.png` });

  const logo = page.getByRole("button", { name: "Show all routes on the map" });
  if (await logo.count()) await logo.click();
  await page.waitForTimeout(700);

  const dest = page.getByRole("button", { name: /Trapani/ }).first();
  let afterDest = null;
  if (await dest.isVisible().catch(() => false)) {
    await dest.click();
    await page.waitForTimeout(1400);
    afterDest = await page.evaluate(() => ({
      hasDetail:
        document.body.innerText.includes("DURATION") ||
        document.body.innerText.includes("Cagliari →"),
      selected: Boolean(document.querySelector('[aria-current="true"]')),
    }));
    await page.screenshot({ path: `/workspace/screenshots/qa/${vp.name}-dest.png` });
  }

  report.push({ viewport: vp.name, afterCag, afterDest, consoleErrors, pageErrors });
  await page.close();
}

writeFileSync("/workspace/screenshots/qa/report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

const failures = [];
for (const row of report) {
  if (!row.afterCag?.mapOk) failures.push(`${row.viewport}: map pane too small ${JSON.stringify(row.afterCag?.mapBox)}`);
  if ((row.afterCag?.destCountVisible ?? 0) < 3) failures.push(`${row.viewport}: destinations not visible`);
  if (!row.afterCag?.logoLabel) failures.push(`${row.viewport}: logo is not a fit-routes control`);
  if (row.consoleErrors.length) failures.push(`${row.viewport}: ${row.consoleErrors.join(" | ")}`);
  if (row.pageErrors.length) failures.push(`${row.viewport}: ${row.pageErrors.join(" | ")}`);
}
if (failures.length) {
  console.error("QA FAILURES:\n" + failures.map((f) => "- " + f).join("\n"));
  process.exit(1);
}
console.log("QA PASS");
await browser.close();
