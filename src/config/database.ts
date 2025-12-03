// import { SQL } from "bun";

// const db = new SQL({
//   url: process.env.DATABASE_URL || "postgres://postgres:142536@localhost:5432/telerad",

//   max: 20,
//   idleTimeout: 30,
//   connectionTimeout: 30,

//   onconnect: () => {
//     console.log("✅ Connected to PostgreSQL");
//   },
//   onclose: () => {
//     console.log("📡 PostgreSQL connection closed");
//   },
// });

// export async function testConnection() {
//   try {
//     await db`SELECT 1`;
//     console.log('✅ Database connection established successfully');
//     return true;
//   } catch (error) {
//     console.error('❌ Database connection failed:', error);
//     return false;
//   }
// }

// export default db;


// import { SQL } from "bun";

// let db: SQL | null = null;

// function getDb() {
//   if (!db) {
//     db = new SQL({
//       url: process.env.DATABASE_URL || "postgres://postgres:142536@localhost:5432/telerad",
//       max: 10,           // fazla yapma
//       idleTimeout: 60,   // düşük olursa bağlantı sürekli kapanır
//       connectionTimeout: 5,
//     });

//     console.log("🔥 PostgreSQL Pool Created");
//   }
//   return db;
// }

// export default   db = getDb();


// db.ts
import { SQL } from "bun";

let db: SQL | null = null;

function getDb() {
  if (!db) {
    db = new SQL({
      url: process.env.DATABASE_URL ||   "postgresql://postgres:CDPmWIjXXrHGIbFrmdBeapDAfJKcIcIO@mainline.proxy.rlwy.net:10844/railway",
      max: 10,
      idleTimeout: 60,
      connectionTimeout: 5,
    });
  }
  return db!;
}

 const sql = getDb();

export default sql;
