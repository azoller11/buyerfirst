import { db } from "../lib/db";
import { NICHE_DEFS } from "../niches/def";

async function main() {
  for (const def of Object.values(NICHE_DEFS)) {
    await db.niche.upsert({
      where: { slug: def.slug },
      create: { slug: def.slug, name: def.name },
      update: { name: def.name },
    });
    console.log(`Niche upserted: ${def.slug}`);
  }
}
main().then(()=>process.exit(0)).catch(e => { console.error(e); process.exit(1); });
