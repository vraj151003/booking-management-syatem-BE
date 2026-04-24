import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateShowTable1700000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'shows',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'movieId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'screenId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'showDate',
            type: 'date',
          },
          {
            name: 'startTime',
            type: 'varchar',
          },
          {
            name: 'endTime',
            type: 'varchar',
          },
          {
            name: 'pricing',
            type: 'json',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'shows',
      new TableForeignKey({
        columnNames: ['movieId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'movies',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'shows',
      new TableForeignKey({
        columnNames: ['screenId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'screens',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('shows');
  }
}
