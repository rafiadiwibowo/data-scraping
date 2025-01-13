import * as cheerio from 'cheerio';
import fs from 'fs';
import FirecrawlApp from '@mendable/firecrawl-js';


// Helper function to clean and format text data
function cleanText(text) {
	return text ? text.replace(/\s+/g, ' ').trim() : null;
}

// Helper function to extract data by label from HTML rows
function extractField(section, label) {
	const row = section.find(`strong:contains("${label}")`).closest('tr');
	if (row.length === 0) return null;
	const fieldValue = cleanText(row.find('td').last().text());
	return fieldValue || null;
}

// Function to extract case diameter without additional JavaScript or unrelated content
function extractCaseDiameter(section) {
	const diameterText = extractField(section, 'Case diameter');
	if (diameterText) {
		// Extract only the number followed by "mm" using regex
		const match = diameterText.match(/^(\d+ mm)/);
		return match ? match[0] : null;
	}
	return null;
}

// Function to extract bracelet strap details
function extractBraceletStrap(section) {
	return {
		bracelet_material: extractField(section, 'Bracelet material'),
		bracelet_color: extractField(section, 'Bracelet color'),
		bracelet_length: extractField(section, 'Bracelet length'),
		lug_width: extractField(section, 'Lug width'),
		clasp: extractField(section, 'Clasp'),
		clasp_material: extractField(section, 'Clasp material'),
	};
}

// Function to extract relevant data for each section (basic, caliber, case, bracelet)
function extractWatchData(html) {
	const $ = cheerio.load(html);

	// Get sections by specific headers
	const basicInfoSection = $('tbody').first(); // First tbody assumed to be basic info
	const caliberSection = $('h3:contains("Caliber")').closest('tbody');
	const caseSection = $('h3:contains("Case")').closest('tbody');
	const braceletSection = $('h3:contains("Bracelet/strap")').closest('tbody');

	const result = {
		basic_info: {
			listing_code: extractField(basicInfoSection, 'Listing code'),
			brand: extractField(basicInfoSection, 'Brand'),
			model: extractField(basicInfoSection, 'Model'),
			reference_number: extractField(basicInfoSection, 'Reference number'),
			dealer_product_code: extractField(basicInfoSection, 'Dealer product code'),
			movement: extractField(basicInfoSection, 'Movement'),
			case_material: extractField(basicInfoSection, 'Case material'),
			bracelet_material: extractField(basicInfoSection, 'Bracelet material'),
			year_of_production: extractField(basicInfoSection, 'Year of production'),
			condition: extractField(basicInfoSection, 'Condition'),
			scope_of_delivery: extractField(basicInfoSection, 'Scope of delivery'),
			gender: extractField(basicInfoSection, 'Gender'),
			location: extractField(basicInfoSection, 'Location'),
			price: extractField(basicInfoSection, 'Price'),
			availability: extractField(basicInfoSection, 'Availability'),
		},
		caliber: {
			movement: extractField(caliberSection, 'Movement'),
			caliber_movement: extractField(caliberSection, 'Caliber/movement'),
			base_caliber: extractField(caliberSection, 'Base caliber'),
			power_reserve: extractField(caliberSection, 'Power reserve'),
			number_of_jewels: extractField(caliberSection, 'Number of jewels'),
		},
		case: {
			case_material: extractField(caseSection, 'Case material'),
			case_diameter: extractCaseDiameter(caseSection),
			thickness: extractField(caseSection, 'Thickness'),
			water_resistance: extractField(caseSection, 'Water resistance'),
			bezel_material: extractField(caseSection, 'Bezel material'),
			crystal: extractField(caseSection, 'Crystal'),
			dial: extractField(caseSection, 'Dial'),
			dial_numerals: extractField(caseSection, 'Dial numerals'),
		},
		bracelet_strap: extractBraceletStrap(braceletSection),
	};

	return result;
}

const app = new FirecrawlApp({ apiKey: "" }); //apikey firecrawl

async function scrapeAndProcess() {
  try {
    const scrapeResult = await app.scrapeUrl('https://example.com/', { //details url
      formats: ['html'], 
      includeTags: ['table'] 
    });

    if (!scrapeResult.success) {
      throw new Error(`Failed to scrape: ${scrapeResult.error}`);
    }

    const result = extractWatchData(scrapeResult.html);

    fs.writeFileSync('./data/result5.json', JSON.stringify(result, null, 4));

    console.log("Data extraction complete!");

  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

scrapeAndProcess();