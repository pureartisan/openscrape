import { Command } from "commander";
import { Scraper, ScrapingOptions } from "./scraper/Scraper";
import * as fs from "fs";
import * as path from "path";

const program = new Command();

program
  .name("openscrape")
  .description(
    "An open-source web scraping tool with LLM-ready data extraction capabilities"
  )
  .version("1.0.0");

program
  .command("scrape")
  .description("Scrape a website and extract data")
  .requiredOption("-u, --url <url>", "URL to scrape")
  .option(
    "-w, --wait-for <selector>",
    "Wait for a specific selector before scraping"
  )
  .option("-s, --screenshot", "Take a screenshot of the page")
  .option("-t, --text", "Extract text content")
  .option("-l, --links", "Extract links")
  .option("-i, --images", "Extract images")
  .option("-o, --output <file>", "Output file path (JSON)")
  .action(async (options) => {
    try {
      const scraper = new Scraper();
      await scraper.initialize();

      const scrapingOptions: ScrapingOptions = {
        url: options.url,
        waitForSelector: options.waitFor,
        screenshot: options.screenshot,
        extractText: options.text,
        extractLinks: options.links,
        extractImages: options.images,
      };

      const result = await scraper.scrape(scrapingOptions);

      if (options.output) {
        // Ensure the directory exists
        const outputDir = path.dirname(options.output);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(options.output, JSON.stringify(result, null, 2));
        console.log(`Results saved to ${options.output}`);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }

      await scraper.close();
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  });

program.parse(process.argv);
