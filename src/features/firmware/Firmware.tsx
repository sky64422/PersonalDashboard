import { memo, useMemo } from 'react';
import { FileBox, GitBranch, ArrowUpRight } from 'lucide-react';
import { ALL, type FirmwareArtifact } from '../../data/model';
import { BUILD_TARGETS } from '../../data/demo';
import { EmptyState, Modal, PanelHeading, SearchInput } from '../../components/ui';
import { filterFirmware } from './filter';
import { CopyPathButton } from './CopyPathButton';

export const Firmware = memo(function Firmware({ records, query, setQuery, model, setModel, onSelect, notify }: { records: FirmwareArtifact[]; query: string; setQuery: (value: string) => void; model: string; setModel: (value: string) => void; onSelect: (record: FirmwareArtifact) => void; notify: (message: string) => void }) {
  const results = useMemo(() => filterFirmware(records, { query, model }), [records, query, model]);
  return <section className="card firmware-card"><PanelHeading title="Firmware library" action={<span className="count-pill">{results.length} / {records.length}</span>} /><div className="filter-bar"><SearchInput value={query} onChange={setQuery} placeholder="파일명, 버전 또는 브랜치 검색" label="펌웨어 검색" /><select aria-label="펌웨어 모델" value={model} onChange={e => setModel(e.target.value)}><option value={ALL}>모든 모델</option>{BUILD_TARGETS.map(target => <option key={target}>{target}</option>)}</select></div>
    {results.length ? <div className="artifact-list">{results.map(record => <div className="artifact-row" key={record.id}><span className="artifact-icon"><FileBox size={24} strokeWidth={1.5} /></span><div className="artifact-info"><button className="artifact-title" onClick={() => onSelect(record)}>{record.filename}<ArrowUpRight size={14} /></button><div className="artifact-meta"><span>{record.model}</span><span><GitBranch size={12} />{record.branch}</span><span>{record.size}</span><span>{record.createdAt}</span></div><code>{record.path}</code></div><span className="version-tag">v{record.version}</span><CopyPathButton path={record.path} label={`${record.filename} 경로 복사`} notify={notify} /></div>)}</div> : <EmptyState onReset={() => { setQuery(''); setModel(ALL); }} />}
  </section>;
});

export const FirmwareDetails = memo(function FirmwareDetails({ record, onClose, notify }: { record: FirmwareArtifact | null; onClose: () => void; notify: (message: string) => void }) {
  return <Modal open={!!record} onClose={onClose} title="Firmware details" panel>{record && <div className="task-details"><span className="artifact-icon"><FileBox size={28} /></span><h2 className="break-word">{record.filename}</h2><dl className="detail-fields"><div><dt>모델</dt><dd>{record.model}</dd></div><div><dt>버전</dt><dd>{record.version}</dd></div><div><dt>브랜치</dt><dd>{record.branch}</dd></div><div><dt>빌드</dt><dd>{record.buildId}</dd></div><div><dt>크기</dt><dd>{record.size}</dd></div></dl><code className="path-block">{record.path}</code><CopyPathButton path={record.path} label="예시 경로 복사" notify={notify} /></div>}</Modal>;
});
