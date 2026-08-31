import { evolutionConfigs, type EvolutionConfig } from "./evolutionConfigs";

const parentMap: Record<number, number> = { 9: 5, 10: 6, 11: 7, 12: 8 };

export function getEditorConfig(version: number): EvolutionConfig {
  const parentVersion = parentMap[version];
  const parent = evolutionConfigs[parentVersion];
  if (!parent) throw new Error(`No editor parent exists for Version ${version}`);
  return {
    ...structuredClone(parent),
    version,
    parentVersion,
    title: `${parent.title} — Editable`,
    description: `An editable visual-builder version of Version ${parentVersion}. Changes are stored as structured browser data.`,
  };
}
