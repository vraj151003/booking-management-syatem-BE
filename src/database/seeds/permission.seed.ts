import { DataSource } from 'typeorm';

export async function seedPermissions(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const permissions = [
      { name: 'CREATE_USER', description: 'Permission to create users' },
      { name: 'READ_USER', description: 'Permission to read users' },
      { name: 'UPDATE_USER', description: 'Permission to update users' },
      { name: 'DELETE_USER', description: 'Permission to delete users' },
      { name: 'CREATE_ROLE', description: 'Permission to create roles' },
      { name: 'READ_ROLE', description: 'Permission to read roles' },
      { name: 'UPDATE_ROLE', description: 'Permission to update roles' },
      { name: 'DELETE_ROLE', description: 'Permission to delete roles' },
      { name: 'CREATE_PERMISSION', description: 'Permission to create permissions' },
      { name: 'READ_PERMISSION', description: 'Permission to read permissions' },
      { name: 'UPDATE_PERMISSION', description: 'Permission to update permissions' },
      { name: 'DELETE_PERMISSION', description: 'Permission to delete permissions' },
      { name: 'ASSIGN_PERMISSION', description: 'Permission to assign permissions to roles' },
      { name: 'MANAGE_THEATER', description: 'Permission to manage theaters' },
      { name: 'MANAGE_MOVIE', description: 'Permission to manage movies' },
      { name: 'MANAGE_SHOW', description: 'Permission to manage shows' },
      { name: 'MANAGE_BOOKING', description: 'Permission to manage bookings' },
    ];

    for (const permission of permissions) {
      const exists = await queryRunner.query(
        `SELECT * FROM "permission" WHERE "name" = $1`,
        [permission.name],
      );

      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO "permission" ("name", "description", "isActive", "createdAt", "updatedAt")
           VALUES ($1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [permission.name, permission.description],
        );
        console.log(`Created permission: ${permission.name}`);
      } else {
        console.log(`Permission already exists: ${permission.name}`);
      }
    }

    await queryRunner.commitTransaction();
    console.log('Permissions seeded successfully');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding permissions:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
