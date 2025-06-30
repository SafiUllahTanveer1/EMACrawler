import { PlaywrightCrawler, createPlaywrightRouter, Dataset, PlaywrightCrawlingContext, LaunchContext, sleep } from 'crawlee';
import { TIMEOUT } from 'dns';
import fs from 'fs';
import { chromium, Page } from 'playwright';  
import { readFile, utils, read } from 'xlsx';
import { error } from 'console';
import { truncate } from 'fs/promises';

const MainURL = 'https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/data-medicines-iso-idmp-standards-post-authorisation/public-data-article-57-database';

const file = 'article-57-product-data_en.xlsx';

const sheet = 'Art57 product data';


let dataset: Awaited<ReturnType<typeof Dataset.open>>;

const exceldata = '';
const router = createPlaywrightRouter();

export const defaultRouterHandler = async ({ page, enqueueLinks, log, request }: PlaywrightCrawlingContext, MainURL: string) => {
await page.goto(MainURL, { waitUntil: 'load' });
log.info('On Start Url...');
const response = await page.request.get('https://www.ema.europa.eu/en/documents/other/article-57-product-data_en.xlsx');
if (!response.ok())
throw new Error('error');
const buffer = await response.body();
const workbook = read(buffer);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rawData = utils.sheet_to_json(worksheet, {
  header: [
    'Productname',
    'Activesubstance',
    'Routeofadministration',
    'Productauthorisationcountry',
    'Marketingauthorisationholder',
    'Pharmacovigilancesystemmasterfilelocation',
    'Pharmacovigilanceenquiriesemailaddress',
    'Pharmacovigilanceenquiriestelephonenumber'
  ],
  range: 20,  // skip Excel header row
  raw: false    
}
);
await dataset.pushData(rawData);
}





  

router.addDefaultHandler(context => defaultRouterHandler(context, MainURL));

const crawlerConfig = {
  requestHandler: router,
  maxConcurrency: 1,
  requestHandlerTimeoutSecs: 60000,
  headless:false,  
};
const crawler = new PlaywrightCrawler(crawlerConfig);

const main = async () => {


dataset = await Dataset.open(`trademarks-${Date.now()}`);
await crawler.run([{ url: MainURL }]);
const items = await dataset.getData();
fs.writeFileSync('crawlee.json', JSON.stringify(items.items, null, 2));
};
main().catch(console.error);
