// Regenerates schema/components.json from the TypeScript catalogue.
// The JSON is the cross-language artifact; the TS is where it is authored.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const { CATALOGUE } = createRequire(import.meta.url)('../dist/mapper/index.js');
writeFileSync(
  new URL('../schema/components.json', import.meta.url),
  `${JSON.stringify(
    {
      $schema: 'https://raw.githubusercontent.com/Morf-Engineering-Inc/rainfalljs/main/schema/components.schema.json',
      rainfallComponents: '1.0',
      description:
        'Component shapes: what each UI component type accepts as data and produces as props. Language-agnostic — the JS mappings in rainfalljs/mapper implement these, but any frontend in any language can read this file and implement them natively.',
      shapes: CATALOGUE,
    },
    null,
    2,
  )}\n`,
);
console.log(`wrote schema/components.json — ${CATALOGUE.length} shapes`);
