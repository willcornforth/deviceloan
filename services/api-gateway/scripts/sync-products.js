/**
 * Sync products from Products Service Cosmos DB to API Gateway projection
 * 
 * Usage: npm run sync-products
 */

const { CosmosClient } = require('@azure/cosmos');
const fs = require('fs');
const path = require('path');

// Load environment variables from local.settings.json
function loadSettings() {
	const settingsPath = path.join(__dirname, '..', 'local.settings.json');
	if (fs.existsSync(settingsPath)) {
		const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
		Object.assign(process.env, settings.Values);
		console.log('✓ Loaded local.settings.json\n');
	}
}

// Source: Products Service Cosmos DB
const SOURCE_ENDPOINT = process.env.SOURCE_COSMOS_ENDPOINT;
const SOURCE_KEY = process.env.SOURCE_COSMOS_KEY;
const SOURCE_DATABASE = process.env.SOURCE_COSMOS_DATABASE_ID || 'device-loan';
const SOURCE_CONTAINER = process.env.SOURCE_COSMOS_CONTAINER_ID || 'products';

// Target: API Gateway Cosmos DB projection
const TARGET_ENDPOINT = process.env.COSMOS_ENDPOINT;
const TARGET_KEY = process.env.COSMOS_KEY;
const TARGET_DATABASE = process.env.COSMOS_DATABASE_ID || 'device-loan';
const TARGET_CONTAINER = process.env.COSMOS_PRODUCTS_CONTAINER_ID || 'products-projection';

async function syncProducts() {
	console.log('🔄 Product Sync Utility\n');
	console.log('========================================\n');

	loadSettings();

	// Validate configuration
	const missingVars = [];
	if (!SOURCE_ENDPOINT) missingVars.push('SOURCE_COSMOS_ENDPOINT');
	if (!SOURCE_KEY) missingVars.push('SOURCE_COSMOS_KEY');
	if (!TARGET_ENDPOINT) missingVars.push('COSMOS_ENDPOINT');
	if (!TARGET_KEY) missingVars.push('COSMOS_KEY');

	if (missingVars.length > 0) {
		console.error('❌ Missing required environment variables:');
		missingVars.forEach(v => console.error(`   - ${v}`));
		console.error('\nAdd these to your local.settings.json or set as environment variables.');
		process.exit(1);
	}

	console.log('Configuration:');
	console.log(`  Source: ${SOURCE_DATABASE}/${SOURCE_CONTAINER}`);
	console.log(`  Target: ${TARGET_DATABASE}/${TARGET_CONTAINER}\n`);

	try {
		// Initialize clients
		console.log('Connecting to Cosmos DB...');
		const sourceClient = new CosmosClient({
			endpoint: SOURCE_ENDPOINT,
			key: SOURCE_KEY
		});

		const targetClient = new CosmosClient({
			endpoint: TARGET_ENDPOINT,
			key: TARGET_KEY
		});

		// Get containers
		const sourceContainer = sourceClient
			.database(SOURCE_DATABASE)
			.container(SOURCE_CONTAINER);

		const targetContainer = targetClient
			.database(TARGET_DATABASE)
			.container(TARGET_CONTAINER);

		// Fetch all products from source
		console.log('Fetching products from source...');
		const { resources: products } = await sourceContainer.items
			.query('SELECT * FROM c')
			.fetchAll();

		console.log(`✓ Found ${products.length} products\n`);

		if (products.length === 0) {
			console.log('No products to sync. Exiting.');
			return;
		}

		console.log('Syncing products to projection...\n');

		// Sync each product
		let successCount = 0;
		let errorCount = 0;

		for (const product of products) {
			try {
				await targetContainer.items.upsert(product);
				console.log(`  ✓ ${product.name} (${product.id})`);
				successCount++;
			} catch (error) {
				console.error(`  ✗ Failed: ${product.id} - ${error.message}`);
				errorCount++;
			}
		}

		console.log('\n========================================');
		console.log('Sync Complete!\n');
		console.log(`Success: ${successCount} products`);
		console.log(`Errors:  ${errorCount} products`);
		console.log(`Total:   ${products.length} products`);

		if (errorCount > 0) {
			process.exit(1);
		}

	} catch (error) {
		console.error('\n❌ Fatal error during sync:', error.message);
		console.error('\nDetails:', error);
		process.exit(1);
	}
}

// Run sync
syncProducts()
	.then(() => {
		console.log('\n✅ Sync completed successfully!\n');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n❌ Sync failed:', error);
		process.exit(1);
	});
