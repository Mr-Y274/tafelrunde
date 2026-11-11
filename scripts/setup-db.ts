import { migrate } from "../lib/db";

async function main() {
  await migrate();
  console.log("Datenbank ist bereit.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Migration fehlgeschlagen";
  console.error(message);
  process.exit(1);
});
