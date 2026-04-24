import { DataSource } from 'typeorm';

export async function seedTheaterOwner(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if THEATRE OWNER role exists, if not create it
    const roleExists = await queryRunner.query(
      `SELECT * FROM "role" WHERE "name" = 'THEATRE OWNER'`,
    );

    let roleId: number;
    if (roleExists.length === 0) {
      const roleResult = await queryRunner.query(
        `INSERT INTO "role" ("name") VALUES ('THEATRE OWNER') RETURNING "id"`,
      );
      roleId = roleResult[0].id;
      console.log('Created THEATRE OWNER role');
    } else {
      roleId = roleExists[0].id;
      console.log('THEATRE OWNER role already exists');
    }

    // Assign SCREEN and SHOW permissions to THEATRE OWNER role
    const theaterOwnerPermissions = [
      'CREATE_SCREEN',
      'READ_SCREEN',
      'UPDATE_SCREEN',
      'DELETE_SCREEN',
      'CREATE_SHOW',
      'READ_SHOW',
      'UPDATE_SHOW',
      'DELETE_SHOW',
      'MANAGE_MOVIE',
    ];

    for (const permissionName of theaterOwnerPermissions) {
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
          console.log(`Assigned permission ${permissionName} to THEATRE OWNER role`);
        } else {
          console.log(`Permission ${permissionName} already assigned to THEATRE OWNER role`);
        }
      } else {
        console.log(`Permission ${permissionName} not found`);
      }
    }

    console.log('SCREEN and SHOW permissions assigned to THEATRE OWNER role');

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding theater owner role:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
