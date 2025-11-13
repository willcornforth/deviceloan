#!/usr/bin/env node
// Script to run the database seed

import 'dotenv/config';
import { getProductRepo } from '../config/appServices';
import { seedCosmosDb } from './cosmos-seed';

const runSeed = async () => {
	try {
		const repo = getProductRepo();
		await seedCosmosDb(repo);
		process.exit(0);
	} catch (error) {
		console.error('Seed failed:', error);
		process.exit(1);
	}
};

runSeed();
