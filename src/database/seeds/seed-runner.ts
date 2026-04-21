import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'movie-booking-system',
  synchronize: false,
});

async function runSeeds() {
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const seedsDir = path.join(__dirname);
    const seedFiles = fs.readdirSync(seedsDir).filter(file => 
      file.endsWith('.seed.ts') && file !== 'seed-runner.ts'
    );

    console.log(`Found ${seedFiles.length} seed files`);

    for (const file of seedFiles) {
      console.log(`\nRunning seed: ${file}`);
      const seedPath = path.join(seedsDir, file);
      const seedModule = await import(seedPath);
      
      // Check if the seed exports a function
      const seedFunction = Object.values(seedModule)[0];
      if (typeof seedFunction === 'function') {
        await seedFunction(dataSource);
        console.log(`✓ ${file} completed`);
      } else {
        console.log(`⚠ ${file} does not export a function, skipping`);
      }
    }

    console.log('\nAll seeds completed successfully');
  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed');
  }
}

runSeeds()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed execution failed:', error);
    process.exit(1);
  });
