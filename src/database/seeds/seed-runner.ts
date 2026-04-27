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

    const seedsDir = path.join(__dirname);
    const seedFiles = fs.readdirSync(seedsDir).filter(file => 
      file.endsWith('.seed.ts') && file !== 'seed-runner.ts'
    );


    for (const file of seedFiles) {
      const seedPath = path.join(seedsDir, file);
      const seedModule = await import(seedPath);
      
      // Check if the seed exports a function
      const seedFunction = Object.values(seedModule)[0];
      if (typeof seedFunction === 'function') {
        await seedFunction(dataSource);
      } else {
      }
    }

  } catch (error) {
    console.error('Error running seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
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
