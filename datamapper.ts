

import { writeFileSync , readFileSync, mkdirSync , existsSync } from "fs";
import { create } from "xmlbuilder2";


interface DrugJson {
  Productname: string;
  Activesubstance: string;
  Routeofadministration: string;
  Productauthorisationcountry: string;
  Marketingauthorisationholder: string;
  Pharmacovigilancesystemmasterfilelocation: string;
  Pharmacovigilanceenquiriesemailaddress: string;
  Pharmacovigilanceenquiriestelephonenumber: string;
}

function buildDrugXml(data: DrugJson): string {
  const doc = create({ version: "1.0", encoding: "UTF-8" })
    .ele("Drug")
      .ele("WordDrugSpecification")
        .ele("DrugVerbalElementText").txt(data.Productname).up().up()
      .ele("ActiveIngredientDetails")
        .ele("Ingredient")
          .ele("IngredientName").txt(data.Activesubstance).up().up().up()
      .ele("ProductDetails")
        .ele("Product")
          .ele("ProductRoute").txt(data.Routeofadministration).up().up().up()
      .ele("MarketCode").txt(data.Productauthorisationcountry).up()
      .ele("PartyDetails")
        .ele("Party")
          .ele("PartyEntity")
            .ele("PartyAddressBook")
              .ele("FormattedNameAddress")
                .ele("Name")
                  .ele("FreeFormatName")
                    .ele("FreeFormatNameDetails")
                      .ele("FreeFormatNameLine")
                        .txt(data.Marketingauthorisationholder)
                      .up().up().up().up().up()
              .ele("Address")
                .ele("AddressCountryCode").txt(data.Pharmacovigilancesystemmasterfilelocation).up().up()
              .ele("ContactInformationDetails")
                .ele("Email").txt(data.Pharmacovigilanceenquiriesemailaddress).up()
                .ele("Phone").txt(data.Pharmacovigilanceenquiriestelephonenumber).up();

  return doc.end({ prettyPrint: true });
}

const jsonData = readFileSync("crawlee.json", "utf-8");
const drugs: DrugJson[] = JSON.parse(jsonData);
const outputFolder = "mappeddata";

if (!existsSync(outputFolder)) {
  mkdirSync(outputFolder);
  console.log(`Created folder: ${outputFolder}`);
}

drugs.forEach((drug, index) => {
  const xmlString = buildDrugXml(drug);
  const filename = `Product_${index + 1}.xml`;
  const fullname = `${outputFolder}/${filename}`
  writeFileSync(fullname, xmlString, "utf-8");
  console.log(`Written: ${filename}`);
});
