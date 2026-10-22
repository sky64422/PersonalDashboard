import { ALL, type FirmwareArtifact } from '../../data/model';
export function filterFirmware(records: FirmwareArtifact[], filters: { query: string; model: string }): FirmwareArtifact[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return records.filter(record => filters.model === ALL || record.model === filters.model)
    .filter(record => `${record.filename} ${record.model} ${record.version} ${record.branch} ${record.buildId}`.toLocaleLowerCase().includes(query));
}
