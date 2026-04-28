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
      { name: 'CREATE_BOOKING', description: 'Permission to create bookings (customer only)' },
      { name: 'VIEW_THEATER_BOOKINGS', description: 'Permission to view bookings for theater owner shows' },
      { name: 'EXPORT_BOOKINGS_CSV', description: 'Permission to export bookings to CSV (theater owner and admin only)' },
      { name: 'CREATE_SCREEN', description: 'Permission to create screens' },
      { name: 'READ_SCREEN', description: 'Permission to read screens' },
      { name: 'UPDATE_SCREEN', description: 'Permission to update screens' },
      { name: 'DELETE_SCREEN', description: 'Permission to delete screens' },
      { name: 'CREATE_SHOW', description: 'Permission to create shows' },
      { name: 'READ_SHOW', description: 'Permission to read shows' },
      { name: 'UPDATE_SHOW', description: 'Permission to update shows' },
      { name: 'DELETE_SHOW', description: 'Permission to delete shows' },
      { name: 'CREATE_COUPON', description: 'Permission to create coupons' },
      { name: 'READ_COUPON', description: 'Permission to read coupons' },
      { name: 'UPDATE_COUPON', description: 'Permission to update coupons' },
      { name: 'DELETE_COUPON', description: 'Permission to delete coupons' },
      { name: 'APPLY_COUPON', description: 'Permission to apply coupons to bookings' },
      { name: 'CREATE_FAVORITE', description: 'Permission to add items to favorites' },
      { name: 'READ_FAVORITE', description: 'Permission to view favorites' },
      { name: 'DELETE_FAVORITE', description: 'Permission to remove items from favorites' },
      { name: 'CREATE_REVIEW', description: 'Permission to create reviews' },
      { name: 'READ_REVIEW', description: 'Permission to read reviews' },
      { name: 'UPDATE_REVIEW', description: 'Permission to update reviews' },
      { name: 'DELETE_REVIEW', description: 'Permission to delete reviews' },
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
      } else {
      }
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding permissions:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
