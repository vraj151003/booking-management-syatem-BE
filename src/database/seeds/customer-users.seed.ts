import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedCustomerUsers(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Get CUSTOMER role ID
    const roleResult = await queryRunner.query(
      `SELECT "id" FROM "role" WHERE "name" = 'CUSTOMER'`,
    );

    if (roleResult.length === 0) {
      throw new Error('CUSTOMER role not found');
    }

    const roleId = roleResult[0].id;

    // Create multiple customer users
    const customers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@yopmail.com',
        mobileNumber: '9876543210',
        password: 'Customer@123',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@yopmail.com',
        mobileNumber: '9876543211',
        password: 'Customer@123',
      },
      {
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@yopmail.com',
        mobileNumber: '9876543212',
        password: 'Customer@123',
      },
      {
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah@yopmail.com',
        mobileNumber: '9876543213',
        password: 'Customer@123',
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@yopmail.com',
        mobileNumber: '9876543214',
        password: 'Customer@123',
      },
    ];

    for (const customer of customers) {
      // Check if user already exists
      const userExists = await queryRunner.query(
        `SELECT * FROM "user" WHERE "email" = $1`,
        [customer.email],
      );

      if (userExists.length === 0) {
        // Hash the password
        const hashedPassword = await bcrypt.hash(customer.password, 10);

        // Insert customer user
        await queryRunner.query(
          `INSERT INTO "user"
          ("id", "firstName", "lastName", "email", "mobileNumber", "password", "roleId", "isVerified", "adminVerified")
          VALUES
          (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, true, true)`,
          [
            customer.firstName,
            customer.lastName,
            customer.email,
            customer.mobileNumber,
            hashedPassword,
            roleId,
          ],
        );

        console.log(`Created customer user: ${customer.email}`);
      } else {
        console.log(`Customer user already exists: ${customer.email}`);
      }
    }

    await queryRunner.commitTransaction();
    console.log('Customer users seeded successfully');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding customer users:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
