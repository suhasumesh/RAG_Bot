import axios from "axios";
import xml2js from "xml2js";
import * as cheerio from "cheerio";
import fs from "fs-extra";
import path from "path";
import pLimit from "p-limit"; // use v3.1.0

const USER_AGENT = "Mozilla/5.0 (compatible; SitemapCrawler/1.0; +https://example.com)";
const CONCURRENCY = 8;
const PAGE_CRAWL = true;

const UIPATH_SITEMAPS: string[] = [
  "https://docs.uipath.com/sitemap.xml",
  "https://www.uipath.com/sitemap.xml",
  "https://engineering.uipath.com/sitemap/sitemap.xml",
];

const CRICKET_SEEDS: string[] = [
  "https://www.espncricinfo.com/sitemap.xml",
  "https://www.icc-cricket.com/sitemap.xml",
  "https://www.cricbuzz.com/sitemap.xml",
  "https://www.wisden.com/sitemap.xml",
  "https://www.thecricketmonthly.com/sitemap.xml",
  "https://www.thecricketer.com/sitemap.xml",
  "https://www.bbc.com/sport/cricket/sitemap.xml"
];

async function fetchUrl(url: string, opts = {}): Promise<string | null> {
  try {
    const r = await axios.get(url, { timeout: 20000, headers: { "User-Agent": USER_AGENT, Accept: "*/*" }, ...opts });
    return r.data;
  } catch (e: any) {
    console.warn("fetchUrl failed:", url, e.message);
    return null;
  }
}

async function parseSitemapXml(xml: string): Promise<any | null> {
  try {
    const parser = new xml2js.Parser({ explicitArray: false });
    return await parser.parseStringPromise(xml);
  } catch (e: any) {
    console.warn("parseSitemapXml failed:", e.message);
    return null;
  }
}

async function expandSitemap(sitemapUrl: string): Promise<string[]> {
  const xml = await fetchUrl(sitemapUrl);
  if (!xml) return [];
  const doc = await parseSitemapXml(xml);
  if (!doc) return [];

  const urls = new Set<string>();
  if (doc.sitemapindex && doc.sitemapindex.sitemap) {
    const arr = Array.isArray(doc.sitemapindex.sitemap) ? doc.sitemapindex.sitemap : [doc.sitemapindex.sitemap];
    arr.forEach((s: any) => s.loc && urls.add(s.loc));
    return Array.from(urls);
  }
  if (doc.urlset && doc.urlset.url) {
    const arr = Array.isArray(doc.urlset.url) ? doc.urlset.url : [doc.urlset.url];
    arr.forEach((u: any) => u.loc && urls.add(u.loc));
  }
  return Array.from(urls);
}

function extractLinksFromHtml(html: string, baseDomain: string): string[] {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    let href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("//")) href = "https:" + href;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const u = new URL(href, baseDomain);
      if (u.hostname === new URL(baseDomain).hostname && u.pathname && u.pathname !== "/") links.add(u.toString());
    } catch (_) {}
  });
  return Array.from(links);
}

async function crawlDomainFromSitemaps(seedSitemaps: string[], outFilePrefix: string): Promise<string[]> {
  const discovered = new Set<string>();
  const toFetchPages = new Set<string>();

  for (const s of seedSitemaps) {
    const candidates = await expandSitemap(s).catch(() => []);
    for (const c of candidates) {
      if (c.endsWith(".xml") || c.includes("sitemap")) {
        const inner = await expandSitemap(c).catch(()=>[]);
        if (inner.length) inner.forEach(x => toFetchPages.add(x));
        else toFetchPages.add(c);
      } else toFetchPages.add(c);
    }
  }

  if (toFetchPages.size < 100) seedSitemaps.forEach(s => toFetchPages.add(s.replace(/\/sitemap.*$/,"/")));

  if (PAGE_CRAWL) {
    const limit = pLimit(CONCURRENCY);
    await Promise.all(Array.from(toFetchPages).map(p => limit(async () => {
      const html = await fetchUrl(p);
      if (!html) return;
      extractLinksFromHtml(html, p).forEach(l => discovered.add(l));
    })));
  }

  Array.from(toFetchPages).forEach(p => discovered.add(p));
  const uniq = Array.from(discovered).filter(Boolean).sort();
  await fs.ensureDir(path.join(process.cwd(), "output"));
  await fs.writeJson(path.join(process.cwd(), "output", `${outFilePrefix}_urls.json`), uniq, { spaces: 2 });
  console.log(`Saved ${uniq.length} urls to output/${outFilePrefix}_urls.json`);
  return uniq;
}

// async wrapper to avoid top-level await
(async () => {
  console.log("Crawling UiPath sitemaps...");
  const uiUrls = await crawlDomainFromSitemaps(UIPATH_SITEMAPS, "uipath");
  console.log("Crawling Cricket seeds...");
  const cricketUrls = await crawlDomainFromSitemaps(CRICKET_SEEDS, "cricket");

  const combined = { uipathSample: uiUrls.slice(0, 200), cricketSample: cricketUrls.slice(0, 500) };
  await fs.writeJson(path.join(process.cwd(), "output", "summary_urls.json"), combined, { spaces: 2 });
  console.log("Done. Summary written to output/summary_urls.json");
})();
