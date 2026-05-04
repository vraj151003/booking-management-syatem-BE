import { DataSource } from 'typeorm';

export async function seedConcessionCategories(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if categories already exist
    const existingCategories = await queryRunner.query(
      `SELECT COUNT(*) as count FROM "concession_categories"`,
    );

    if (existingCategories[0].count > 0) {
      await queryRunner.commitTransaction();
      return;
    }

    // Insert 10 concession categories
    const categories = [
      { name: 'Beverages', description: 'Soft drinks, juices, and other beverages', displayOrder: 1 },
      { name: 'Snacks', description: 'Chips, nuts, and other snack items', displayOrder: 2 },
      { name: 'Candy', description: 'Various candies and sweets', displayOrder: 3 },
      { name: 'Popcorn', description: 'Fresh popcorn in various flavors and sizes', displayOrder: 4 },
      { name: 'Hot Food', description: 'Hot dogs, nachos, and other warm items', displayOrder: 5 },
      { name: 'Ice Cream', description: 'Ice cream and frozen desserts', displayOrder: 6 },
      { name: 'Combos', description: 'Combo deals and meal packages', displayOrder: 7 },
      { name: 'Healthy Options', description: 'Fruit cups, salads, and healthy snacks', displayOrder: 8 },
      { name: 'Kids Special', description: 'Special items for children', displayOrder: 9 },
      { name: 'Premium Items', description: 'Gourmet and specialty food items', displayOrder: 10 },
    ];

    for (const category of categories) {
      await queryRunner.query(
        `INSERT INTO "concession_categories" ("name", "description", "displayOrder", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, NOW(), NOW())`,
        [category.name, category.description, category.displayOrder],
      );
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
