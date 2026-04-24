import { DataSource } from 'typeorm';

export async function seedCustomer(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if CUSTOMER role exists, if not create it
    const roleExists = await queryRunner.query(
      `SELECT * FROM "role" WHERE "name" = 'CUSTOMER'`,
    );

    let roleId: number;
    if (roleExists.length === 0) {
      const roleResult = await queryRunner.query(
        `INSERT INTO "role" ("name") VALUES ('CUSTOMER') RETURNING "id"`,
      );
      roleId = roleResult[0].id;
      console.log('Created CUSTOMER role');
    } else {
      roleId = roleExists[0].id;
      console.log('CUSTOMER role already exists');
    }

    // Assign CREATE_BOOKING permission to CUSTOMER role
    const customerPermissions = ['CREATE_BOOKING'];

    for (const permissionName of customerPermissions) {
      const permission = await queryRunner.query(
        `SELECT "id" FROM "permission" WHERE "name" = $1 AND "isActive" = true`,
        [permissionName],
      );

      if (permission.length > 0) {
        const permissionId = permission[0].id;

        const alreadyAssigned = await queryRunner.query(
          `SELECT * FROM "role_permission" WHERE "roleId" = $1 AND "permissionId" = $2`,
          [roleId, permissionId],
        );

        if (alreadyAssigned.length === 0) {
          await queryRunner.query(
            `INSERT INTO "role_permission" ("roleId", "permissionId") VALUES ($1, $2)`,
            [roleId, permissionId],
          );
        } else {
        }
      } else {
      }
    }
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding customer role:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
