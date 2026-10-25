import { ALL, type FirmwareArtifact } from '../../data/model';
import { createTextMatcher } from '../../data/search';

export function filterFirmware(records: FirmwareArtifact[], filters: { query: string; model: string }): FirmwareArtifact[] {
  const matches = createTextMatcher(filters.query);
  const matchModel = filters.model !== ALL;
  return records.filter(record => {
    if (matchModel && record.model !== filters.model) return false;
    return matches(`${record.filename} ${record.model} ${record.version} ${record.branch} ${record.buildId}`);
  });
}
