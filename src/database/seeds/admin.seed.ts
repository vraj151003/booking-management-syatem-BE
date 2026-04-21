import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if ADMIN role exists, if not create it
    const roleExists = await queryRunner.query(
      `SELECT * FROM "role" WHERE "name" = 'ADMIN'`,
    );

    let roleId: number;
    if (roleExists.length === 0) {
      const roleResult = await queryRunner.query(
        `INSERT INTO "role" ("name") VALUES ('ADMIN') RETURNING "id"`,
      );
      roleId = roleResult[0].id;
      console.log('Created ADMIN role');
    } else {
      roleId = roleExists[0].id;
      console.log('ADMIN role already exists');
    }

    // Check if admin user already exists
    const userExists = await queryRunner.query(
      `SELECT * FROM "user" WHERE "email" = 'vraj@yopmail.com'`,
    );

    if (userExists.length === 0) {
      // Hash the password
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      // Insert admin user
      await queryRunner.query(
        `INSERT INTO "user"
        ("id", "firstName", "lastName", "email", "mobileNumber", "password", "roleId", "isVerified", "adminVerified")
        VALUES
        (uuid_generate_v4(), 'Admin', 'User', 'vraj@yopmail.com', '1234567890', $1, $2, true, true)`,
        [hashedPassword, roleId],
      );

      console.log('Created admin user with email: vraj@yopmail.com');
    } else {
      console.log('Admin user already exists with email: vraj@yopmail.com');
    }

    // Assign all permissions to ADMIN role
    const allPermissions = await queryRunner.query(
      `SELECT "id" FROM "permission" WHERE "isActive" = true`,
    );

    for (const permission of allPermissions) {
      const alreadyAssigned = await queryRunner.query(
        `SELECT * FROM "role_permission" WHERE "roleId" = $1 AND "permissionId" = $2`,
        [roleId, permission.id],
      );

      if (alreadyAssigned.length === 0) {
        await queryRunner.query(
          `INSERT INTO "role_permission" ("roleId", "permissionId") VALUES ($1, $2)`,
          [roleId, permission.id],
        );
        console.log(`Assigned permission ${permission.id} to ADMIN role`);
      }
    }

    console.log('All permissions assigned to ADMIN role');

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding admin user:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
