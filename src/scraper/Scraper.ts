import { chromium, Browser, Page } from "playwright";
import { Logger } from "../logger/logger";
import { Security } from "./Security";

export interface ScrapingOptions {
  url: string;
  waitForSelector?: string;
  screenshot?: boolean;
  screenshotFullPage?: boolean;
  extractText?: boolean;
  extractLinks?: boolean;
  extractImages?: boolean;
  removeClassNames?: string[] | boolean;
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

  async scrape(
    options: ScrapingOptions = {
      url: "",
      waitForSelector: "",
      screenshot: false,
      screenshotFullPage: false,
      extractText: false,
      extractLinks: false,
      extractImages: false,
      removeClassNames: true,
    }
  ): Promise<ScrapingResult> {
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
        await page.screenshot({
          path: screenshotPath,
          fullPage: options.screenshotFullPage,
        });
        result.screenshotPath = screenshotPath;
      }

      if (options.extractText) {
        Logger.debug("Extracting text...");
        result.text = await this.extractText(page, options.removeClassNames);
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

  private async extractText(
    page: Page,
    removeClassNamesOpt: string[] | boolean = true
  ) {
    page.on("console", (message) => {
      Logger.browser(message.type(), message.text());
    });

    const html = await page.evaluate(
      async (removeClassNames: string[] | boolean) => {
        // Create a clone of the document to avoid modifying the original
        const doc = document.cloneNode(true) as Document;

        // Remove unnecessary elements but keep important meta tags and links
        const selectors = [
          "script",
          "style",
          "noscript",
          "iframe",
          "object",
          "embed",
          "svg",
          "canvas",
          "audio",
          "video",
          "link[rel='stylesheet']",
          "link[rel='icon']",
          "link[rel='preload']",
        ];
        const elementsToRemove = doc.querySelectorAll(selectors.join(","));

        // Remove HTML comments
        const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_COMMENT, null);
        let comment;
        while ((comment = walker.nextNode())) {
          if (comment.parentNode) {
            comment.parentNode.removeChild(comment);
          }
        }

        const removeOrReplaceElement = async (element: Element) => {
          // handle video iframes
          if (element.tagName.toLowerCase() === "iframe") {
            const src = element.getAttribute("src");
            const isVideo =
              src && (src.includes("youtube.com") || src.includes("vimeo.com"));
            if (isVideo) {
              const link = doc.createElement("a");
              link.href = src!;
              link.textContent = `[Video: ${src}]`;
              element.parentNode?.replaceChild(link, element);
              return false;
            }
          }

          element.remove();
          return true;
        };

        console.log("elementsToRemove", elementsToRemove.length);

        let itemsRemoved = 0;
        const itemsToRemove = Array.from(elementsToRemove);
        for (const el of itemsToRemove) {
          const removed = await removeOrReplaceElement(el);
          if (removed) {
            itemsRemoved++;
          }
        }

        console.info(`Removed ${itemsRemoved} elements`);

        const removeClassNamesFromElement = (
          element: Element,
          classNames: string[] | boolean
        ) => {
          if (!classNames) {
            return;
          }
          if (classNames === true) {
            element.removeAttribute("class");
          } else {
            element.classList.remove(...classNames);
          }
        };

        if (removeClassNames) {
          const selector =
            removeClassNames === true
              ? "*"
              : removeClassNames.map((className) => `.${className}`).join(",");
          doc
            .querySelectorAll(selector)
            .forEach((el) => removeClassNamesFromElement(el, removeClassNames));
        }

        // Remove style attributes from all elements
        doc.querySelectorAll("*").forEach((el) => {
          el.removeAttribute("style");
        });

        return doc.documentElement.outerHTML;
      },
      removeClassNamesOpt
    );

    // Get the cleaned HTML and remove unnecessary whitespace
    return this.cleanWhitespace(html);
  }

  private cleanWhitespace(html: string): string {
    return (
      html
        // Remove multiple consecutive newlines
        .replace(/\n+/g, "\n")
        // Remove comments with an empty string
        .replace(/<!--\s*-->/g, "")
        // Remove empty class attributes
        .replace(/class="\s*"/g, "")
        // Remove style attributes
        .replace(/\s+style="[^"]*"/g, "")
        // Remove whitespace between tags
        .replace(/>\s+</g, "><")
        // Remove leading/trailing whitespace from lines
        .replace(/^\s+|\s+$/gm, "")
        // Remove multiple consecutive spaces
        .replace(/\s+/g, " ")
        // Remove spaces before closing tags
        .replace(/\s+>/g, ">")
        // Remove spaces after opening tags
        .replace(/<\s+/g, "<")
        // Remove spaces around attributes
        .replace(/\s*=\s*/g, "=")
        // Remove spaces between attributes
        .replace(/"\s+/g, '" ')
        // Remove spaces before self-closing tags
        .replace(/\s+\/>/g, "/>")
        // Remove spaces after self-closing tags
        .replace(/\/>\s+/g, "/>")
        // Remove spaces before closing brackets
        .replace(/\s+>/g, ">")
        // Remove spaces after opening brackets
        .replace(/<\s+/g, "<")
        // Trim the final result
        .trim()
    );
  }
}
