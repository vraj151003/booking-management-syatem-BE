import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateCastAndCrewTables1777964087885 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create casts table
    await queryRunner.createTable(
      new Table({
        name: 'casts',
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
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'character',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'image',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
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

    // Create foreign key for casts
    await queryRunner.createForeignKey(
      'casts',
      new TableForeignKey({
        columnNames: ['movieId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'movies',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for casts
    await queryRunner.createIndex(
      'casts',
      new TableIndex({
        name: 'IDX_CASTS_MOVIE_ID',
        columnNames: ['movieId'],
      }),
    );

    await queryRunner.createIndex(
      'casts',
      new TableIndex({
        name: 'IDX_CASTS_ORDER',
        columnNames: ['order'],
      }),
    );

    // Create crews table
    await queryRunner.createTable(
      new Table({
        name: 'crews',
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
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['DIRECTOR', 'WRITER', 'MUSIC_DIRECTOR', 'SCREENPLAY', 'PRODUCER', 'CINEMATOGRAPHER', 'EDITOR'],
          },
          {
            name: 'image',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
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

    // Create foreign key for crews
    await queryRunner.createForeignKey(
      'crews',
      new TableForeignKey({
        columnNames: ['movieId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'movies',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for crews
    await queryRunner.createIndex(
      'crews',
      new TableIndex({
        name: 'IDX_CREWS_MOVIE_ID',
        columnNames: ['movieId'],
      }),
    );

    await queryRunner.createIndex(
      'crews',
      new TableIndex({
        name: 'IDX_CREWS_ROLE',
        columnNames: ['role'],
      }),
    );

    await queryRunner.createIndex(
      'crews',
      new TableIndex({
        name: 'IDX_CREWS_ORDER',
        columnNames: ['order'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('crews');
    await queryRunner.dropTable('casts');
  }
}
