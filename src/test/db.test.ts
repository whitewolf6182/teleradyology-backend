import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { sql } from "../config/database";

describe("PostgreSQL TEST TABLE Checks", () => {

  beforeAll(async () => {
    // tablo var mı kontrol et
    await sql`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // temiz başlangıç
   await sql`TRUNCATE test_table RESTART IDENTITY`;
  });

  test("Boş tablo testi", async () => {
    const rows = await sql`SELECT * FROM test_table`;
    expect(rows.length).toBe(0);
  });

test("Parallel Insert Load Test (100 paralel işlem)", async () => {
  const parallelCount = 100;

  const tasks = Array.from({ length: parallelCount }, (_, i) =>
    sql`
      INSERT INTO test_table (name)
      VALUES (${`Parallel_${i}_${Date.now()}`})
    `
  );

  await Promise.all(tasks);

  const count = await sql`
    SELECT COUNT(*) FROM test_table
  `;

  console.log("Toplam kayıt:", count[0].count);
  expect(Number(count[0].count)).toBeGreaterThanOrEqual(parallelCount);
});



  test("SELECT testi", async () => {
    const rows = await sql`SELECT * FROM test_table`;
    expect(rows.length).toBeGreaterThan(0);
  });

//   test("DELETE testi", async () => {
//     const deleted = await sql`
//       DELETE FROM test_table
//       WHERE id = (SELECT id FROM test_table LIMIT 1)
//       RETURNING id;
//     `;

//     expect(deleted.length).toBe(1);
//   });

  afterAll(async () => {
    console.log("🧹 Test tamamlandı");
  });
});
