import { ALL, type FirmwareArtifact } from '../../data/model';

export function filterFirmware(records: FirmwareArtifact[], filters: { query: string; model: string }): FirmwareArtifact[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const matchModel = filters.model !== ALL;
  return records.filter(record => {
    if (matchModel && record.model !== filters.model) return false;
    if (!query) return true;
    return `${record.filename} ${record.model} ${record.version} ${record.branch} ${record.buildId}`.toLocaleLowerCase().includes(query);
  });
}
