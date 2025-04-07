import { chromium, Browser } from "playwright";
import { Logger } from "../logger/logger";
import { Security } from "./Security";
export interface ScrapingOptions {
  url: string;
  waitForSelector?: string;
  screenshot?: boolean;
  extractText?: boolean;
  extractLinks?: boolean;
  extractImages?: boolean;
}

export interface ScrapingResult {
  url: string;
  text?: string;
  links?: string[];
  images?: string[];
  screenshotPath?: string;
  timestamp: string;
}

export class Scraper {
  private browser: Browser | null = null;
  private security: Security = new Security();

  async initialize() {
    Logger.info("Initializing browser...");
    this.browser = await chromium.launch({
      headless: true,
    });
    Logger.info("Browser initialized");
  }

  async scrape(options: ScrapingOptions): Promise<ScrapingResult> {
    const validationError = this.security.assertAllowedUrl(options.url);
    if (validationError) {
      throw validationError;
    }

    if (!this.browser) {
      await this.initialize();
    }

    Logger.info(`Scraping ${options.url}...`);
    const page = await this.browser!.newPage();
    const result: ScrapingResult = {
      url: options.url,
      timestamp: new Date().toISOString(),
    };

    try {
      Logger.debug(`Navigating to ${options.url}...`);
      await page.goto(options.url, { waitUntil: "networkidle" });

      if (options.waitForSelector) {
        Logger.debug(`Waiting for ${options.waitForSelector}...`);
        await page.waitForSelector(options.waitForSelector);
      }

      if (options.screenshot) {
        Logger.debug("Taking screenshot...");
        const screenshotPath = `screenshots/${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshotPath = screenshotPath;
      }

      if (options.extractText) {
        Logger.debug("Extracting text...");
        result.text = await page.evaluate(() => {
          return document.body.innerText;
        });
      }

      if (options.extractLinks) {
        Logger.debug("Extracting links...");
        result.links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("a"))
            .map((a) => a.href)
            .filter((href) => href && !href.startsWith("javascript:"));
        });
      }

      if (options.extractImages) {
        Logger.debug("Extracting images...");
        result.images = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("img"))
            .map((img) => img.src)
            .filter((src) => src);
        });
      }
    } catch (error) {
      Logger.error(`Error scraping ${options.url}:`, error);
      throw error;
    } finally {
      Logger.debug("Closing page...");
      await page.close();
    }

    return result;
  }

  async close() {
    if (this.browser) {
      Logger.debug("Closing browser...");
      await this.browser.close();
      this.browser = null;
    }
  }
}
