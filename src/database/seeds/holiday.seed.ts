import { DataSource } from 'typeorm';

export async function seedHolidays(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const holidays = [
      { date: '2026-05-01', name: 'Buddha Purnima', isActive: true },
      { date: '2026-05-27', name: 'Bakrid / Eid-ul-Zuha', isActive: true },
      { date: '2026-06-26', name: 'Muharram', isActive: true },
      { date: '2026-08-15', name: 'Independence Day', isActive: true },
      { date: '2026-08-26', name: 'Milad-un-Nabi / Eid-e-Milad', isActive: true },
      { date: '2026-08-28', name: 'Raksha Bandhan', isActive: true },
      { date: '2026-09-04', name: 'Janmashtami', isActive: true },
      { date: '2026-10-02', name: 'Gandhi Jayanti', isActive: true },
      { date: '2026-10-20', name: 'Dussehra', isActive: true },
      { date: '2026-11-08', name: 'Diwali (Laxmi Puja)', isActive: true },
      { date: '2026-11-24', name: 'Guru Nanak Jayanti', isActive: true },
      { date: '2026-12-25', name: 'Christmas', isActive: true },
    ];

    for (const holiday of holidays) {
      const exists = await queryRunner.query(
        `SELECT * FROM "holidays" WHERE "date" = $1`,
        [holiday.date],
      );

      if (exists.length === 0) {
        await queryRunner.query(
          `INSERT INTO "holidays" ("date", "name", "isActive", "createdAt", "updatedAt")
           VALUES ($1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [holiday.date, holiday.name],
        );
      }
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
