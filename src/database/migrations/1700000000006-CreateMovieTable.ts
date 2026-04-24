import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMovieTable1700000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'movies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'duration',
            type: 'int',
          },
          {
            name: 'genre',
            type: 'varchar',
          },
          {
            name: 'rating',
            type: 'float',
            default: 0,
          },
          {
            name: 'language',
            type: 'varchar',
          },
          {
            name: 'releaseDate',
            type: 'date',
          },
          {
            name: 'poster',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'trailer',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('movies');
  }
}
