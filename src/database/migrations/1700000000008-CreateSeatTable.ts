import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSeatTable1700000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'seat',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'seatNumber',
            type: 'varchar',
          },
          {
            name: 'seatType',
            type: 'enum',
            enum: ['GOLD', 'SILVER', 'PLATINUM', 'STANDARD'],
            default: "'STANDARD'",
          },
          {
            name: 'row',
            type: 'varchar',
          },
          {
            name: 'price',
            type: 'int',
          },
          {
            name: 'screenId',
            type: 'uuid',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'seat',
      new TableForeignKey({
        columnNames: ['screenId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'screens',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('seat');
  }
}
