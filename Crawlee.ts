import { PlaywrightCrawler, createPlaywrightRouter, Dataset, PlaywrightCrawlingContext, LaunchContext, sleep } from 'crawlee';
import { TIMEOUT } from 'dns';
import fs from 'fs';
import { chromium, Page } from 'playwright';  
import { readFile, utils, read } from 'xlsx';
import axios from 'axios';
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
console.log ('response body is created');
console.log (buffer);
const workbook = read(buffer);
const sheetName = workbook.SheetNames[0];
console.log(sheetName);
const worksheet = workbook.Sheets[sheetName];
    //console.log(worksheet)
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
console.log(rawData.length);
await dataset.pushData(rawData);
console.log ('data is pushed');
}



// async function readExcelFromUrl( url: string, sheet: string ) {
// const res = await axios.get(url, { responseType: 'arraybuffer' });
// console.log('Data is in array buffer')
//   // 2. Read Excel file into workbook
//   const workbook = read(res.data);
//   console.log('file is read')
//   const worksheet = workbook.Sheets[sheet];
//   if (!worksheet) throw new Error(`Sheet "${sheet}" not found.`);
//   else
// console.log('data array created');


//   const rawData = utils.sheet_to_json(worksheet, {
//   header: [
//     'Productname',
//     'Activesubstance',
//     'Routeofadministration',
//     'Productauthorisationcountry',
//     'Marketingauthorisationholder',
//     'Pharmacovigilancesystemmasterfilelocation',
//     'Pharmacovigilanceenquiriesemailaddress',
//     'Pharmacovigilanceenquiriestelephonenumber'
//   ],
//   range: 20,  // skip Excel header row
//   raw: false
  

// }


// )
// return rawData;
// console.log('')
// }

  

router.addDefaultHandler(context => defaultRouterHandler(context, MainURL));

const crawlerConfig = {
  requestHandler: router,
  maxConcurrency: 1,
  requestHandlerTimeoutSecs: 60000,
  headless:false,  
};
const crawler = new PlaywrightCrawler(crawlerConfig);

const main = async () => {


  //const exceldata = await readExcelFromUrl('https://www.ema.europa.eu/en/documents/other/article-57-product-data_en.xlsx','Art57 product data' )
dataset = await Dataset.open(`trademarks-${Date.now()}`);
await crawler.run([{ url: MainURL }]);
const items = await dataset.getData();
fs.writeFileSync('crawlee.json', JSON.stringify(items.items, null, 2));
};
main().catch(console.error);
