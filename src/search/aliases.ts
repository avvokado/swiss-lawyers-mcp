const specialtyAliases = new Map<string, string>([
  ["family law", "familienrecht"],
  ["familienrecht", "familienrecht"],
  ["arbeitsrecht", "arbeitsrecht"],
  ["employment", "arbeitsrecht"],
  ["employment law", "arbeitsrecht"],
  ["immigration", "migrationsrecht"],
  ["immigration law", "migrationsrecht"],
  ["migrationsrecht", "migrationsrecht"],
  ["criminal law", "strafrecht"],
  ["criminal", "strafrecht"],
  ["strafrecht", "strafrecht"],
  ["commercial law", "wirtschaftsrecht"],
  ["business law", "wirtschaftsrecht"],
  ["corporate law", "wirtschaftsrecht"],
  ["wirtschaftsrecht", "wirtschaftsrecht"],
  ["company law", "wirtschaftsrecht"],
  ["intellectual property", "ip-recht"],
  ["ip", "ip-recht"],
  ["trademark", "ip-recht"],
  ["markenrecht", "ip-recht"],
  ["ip-recht", "ip-recht"],
  ["tax", "steuerrecht"],
  ["tax law", "steuerrecht"],
  ["steuerrecht", "steuerrecht"],
  ["tenancy", "mietrecht"],
  ["rental law", "mietrecht"],
  ["lease", "mietrecht"],
  ["mietrecht", "mietrecht"],
  ["inheritance", "erbrecht"],
  ["estate", "erbrecht"],
  ["erbrecht", "erbrecht"],
]);

const locationAliases = new Map<string, string>([
  ["zurich", "zuerich"],
  ["zuerich", "zuerich"],
  ["zürich", "zuerich"],
  ["winterthur", "winterthur"],
  ["bern", "bern"],
  ["biel", "biel/bienne"],
  ["bienne", "biel/bienne"],
  ["geneva", "genf"],
  ["genf", "genf"],
  ["geneve", "genf"],
  ["lausanne", "lausanne"],
  ["vevey", "vevey"],
  ["basel", "basel"],
  ["luzern", "luzern"],
  ["lucerne", "luzern"],
  ["st gallen", "st. gallen"],
  ["st. gallen", "st. gallen"],
  ["lugano", "lugano"],
  ["bellinzona", "bellinzona"],
  ["chiasso", "chiasso"],
  ["zh", "zh"],
  ["be", "be"],
  ["ge", "ge"],
  ["vd", "vd"],
  ["bs", "bs"],
  ["lu", "lu"],
  ["sg", "sg"],
  ["ti", "ti"],
]);

const languageAliases = new Map<string, string>([
  ["de", "deutsch"],
  ["german", "deutsch"],
  ["deutsch", "deutsch"],
  ["fr", "franzoesisch"],
  ["french", "franzoesisch"],
  ["francais", "franzoesisch"],
  ["franzoesisch", "franzoesisch"],
  ["it", "italienisch"],
  ["italian", "italienisch"],
  ["italienisch", "italienisch"],
  ["en", "englisch"],
  ["english", "englisch"],
  ["englisch", "englisch"],
]);

const relatedSpecialties: Record<string, string[]> = {
  familienrecht: ["erbrecht", "mietrecht"],
  arbeitsrecht: ["wirtschaftsrecht", "migrationsrecht"],
  migrationsrecht: ["arbeitsrecht", "familienrecht"],
  strafrecht: ["migrationsrecht", "wirtschaftsstrafrecht"],
  wirtschaftsrecht: ["steuerrecht", "arbeitsrecht", "ip-recht"],
  "ip-recht": ["wirtschaftsrecht", "steuerrecht"],
  steuerrecht: ["wirtschaftsrecht", "ip-recht"],
  mietrecht: ["familienrecht", "erbrecht"],
  erbrecht: ["familienrecht", "steuerrecht"],
};

const nearbyLocationMap: Record<string, string[]> = {
  zuerich: ["winterthur", "zh", "zug", "luzern", "sg"],
  winterthur: ["zuerich", "zh", "sg"],
  bern: ["biel/bienne", "be", "fribourg", "lausanne"],
  "biel/bienne": ["bern", "be", "neuchatel"],
  genf: ["ge", "lausanne", "vevey"],
  lausanne: ["vevey", "vd", "genf", "fribourg"],
  vevey: ["lausanne", "vd", "genf"],
  basel: ["bs", "zh", "bern"],
  luzern: ["lu", "zuerich", "zug", "bern"],
  "st. gallen": ["sg", "zuerich", "winterthur"],
  lugano: ["bellinzona", "chiasso", "ti"],
  bellinzona: ["lugano", "chiasso", "ti"],
  chiasso: ["lugano", "bellinzona", "ti"],
  zh: ["zuerich", "winterthur", "sg", "lu"],
  be: ["bern", "biel/bienne", "vd"],
  ge: ["genf", "vd"],
  vd: ["lausanne", "vevey", "genf", "be"],
  bs: ["basel", "zh"],
  lu: ["luzern", "zuerich", "be"],
  sg: ["st. gallen", "winterthur", "zuerich"],
  ti: ["lugano", "bellinzona", "chiasso"],
};

const specialtyPhraseAliases = new Map(
  [...specialtyAliases.entries()].filter(([alias]) => alias.includes(" ")),
);

const locationPhraseAliases = new Map(
  [...locationAliases.entries()].filter(([alias]) => alias.includes(" ")),
);

export function resolveSpecialtyAlias(value: string): string {
  return specialtyAliases.get(value) ?? value;
}

export function resolveLocationAlias(value: string): string {
  return locationAliases.get(value) ?? value;
}

export function resolveLanguageAlias(value: string): string {
  return languageAliases.get(value) ?? value;
}

export function getRelatedSpecialties(value: string): string[] {
  return relatedSpecialties[value] ?? [];
}

export function getNearbyLocations(value: string): string[] {
  return nearbyLocationMap[value] ?? [];
}

export function extractQueryPhrases(value: string): string[] {
  const phrases = new Set<string>();

  if (value.includes(" ")) {
    phrases.add(value);
  }

  for (const [alias, canonical] of specialtyPhraseAliases.entries()) {
    if (value.includes(alias)) {
      phrases.add(canonical);
    }
  }

  for (const [alias, canonical] of locationPhraseAliases.entries()) {
    if (value.includes(alias)) {
      phrases.add(canonical);
    }
  }

  return [...phrases];
}
