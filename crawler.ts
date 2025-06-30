import { PlaywrightCrawler, createPlaywrightRouter, Dataset, PlaywrightCrawlingContext, LaunchContext, sleep } from 'crawlee';
import { TIMEOUT } from 'dns';
import fs from 'fs';
import { chromium, Page } from 'playwright';
import { readFile, utils } from 'xlsx';
import axios from 'axios';

const MainURL = 'https://www.ema.europa.eu/en/human-regulatory-overview/post-authorisation/data-medicines-iso-idmp-standards-post-authorisation/public-data-article-57-database';

const file = 'article-57-product-data_en.xlsx';

const sheet = 'Art57 product data';

let dataset: Awaited<ReturnType<typeof Dataset.open>>;

const excelData = '';
const router = createPlaywrightRouter();

export const defaultRouterHandler = async ({ page, enqueueLinks, log, request }: PlaywrightCrawlingContext, MainURL: string) => {
await page.goto(MainURL, { waitUntil: 'load' });
log.info('On Start Url...');

const [ download ] = await Promise.all([
page.waitForEvent('download'),
page.locator('a[href="/en/documents/other/article-57-product-data_en.xlsx"]').click()
]);

await download.saveAs('article-57-product-data.xlsx');  
console.log('The file is opened');
};

const readExcel = ({ file, sheet }: { file: string, sheet: string }): any => {
  const workbook = readFile(file);
  console.log('file is read')
  const worksheet = workbook.Sheets[sheet];
  if (!worksheet) throw new Error(`Sheet "${sheet}" not found.`);
  else
console.log('data array created');


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

)
return rawData;

}

  

router.addDefaultHandler(context => defaultRouterHandler(context, MainURL));

const crawlerConfig = {
  requestHandler: router,
  maxConcurrency: 1,
  requestHandlerTimeoutSecs: 300,
  headless:false,  
};
const crawler = new PlaywrightCrawler(crawlerConfig);

const main = async () => {
    
await crawler.run([{ url: MainURL }]);

const excelData = readExcel({
    file: 'article-57-product-data.xlsx',
    sheet: 'Art57 product data',
})

dataset = await Dataset.open(`trademarks-${Date.now()}`);
await dataset.pushData(excelData);
console.log('data is pushed');
const items = await dataset.getData();
fs.writeFileSync('crawlee.json', JSON.stringify(items.items, null, 2));
};

main().catch(console.error);
  
