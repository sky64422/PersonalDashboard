import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, Box, FileBox, Search, SquareCheck } from 'lucide-react';
import { Modal } from './ui';
import type { Task, Build, FirmwareArtifact } from '../data/model';
import { createTextMatcher } from '../data/search';

const GROUP_LIMIT = 4;
export function GlobalSearch({ open, onClose, tasks, builds, firmware, onTask, onBuild, onFirmware }: {
  open: boolean; onClose: () => void; tasks: Task[]; builds: Build[]; firmware: FirmwareArtifact[];
  onTask: (task: Task) => void; onBuild: (build: Build) => void; onFirmware: (record: FirmwareArtifact) => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const groups = useMemo(() => {
    if (!open) return [];
    const matchesQuery = createTextMatcher(query);
    return [
      { id: 'tasks', label: '내 업무', items: tasks.map(task => ({ id: `task-${task.id}`, title: task.title, meta: `${task.key} · ${task.project}`, icon: SquareCheck, action: () => onTask(task) })) },
      { id: 'builds', label: '빌드', items: builds.map(build => ({ id: `build-${build.id}`, title: `${build.target} · ${build.branch}`, meta: `${build.id} · ${build.status}`, icon: Box, action: () => onBuild(build) })) },
      { id: 'firmware', label: '펌웨어', items: firmware.map(record => ({ id: `firmware-${record.id}`, title: record.filename, meta: `${record.model} · ${record.version} · ${record.buildId}`, icon: FileBox, action: () => onFirmware(record) })) },
    ].map(group => {
      const matches = group.items.filter(item => matchesQuery(`${item.title} ${item.meta}`));
      return { ...group, total: matches.length, items: matches.slice(0, GROUP_LIMIT) };
    }).filter(group => group.items.length);
  }, [open, query, tasks, builds, firmware, onTask, onBuild, onFirmware]);

  const results = useMemo(() => groups.flatMap(group => group.items), [groups]);
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  const activeId = results[activeIndex]?.id;
  useEffect(() => {
    if (open && activeId) document.getElementById(`result-${activeId}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, activeId]);
  function select(id: string) {
    const result = results.find(item => item.id === id);
    if (result) { onClose(); result.action(); }
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
    } else if (event.key === 'Enter' && activeId) { event.preventDefault(); select(activeId); }
    else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); setActive(event.key === 'Home' ? 0 : results.length - 1); }
  }
  return <Modal open={open} onClose={onClose} title="통합 검색">
    <div className="global-search-field"><Search size={19} /><input role="combobox" aria-expanded={open} aria-controls="global-results" aria-activedescendant={activeId ? `result-${activeId}` : undefined} aria-autocomplete="list" aria-label="통합 검색어" placeholder="업무 이름, 빌드 또는 펌웨어 검색…" value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKeyDown} autoFocus /></div>
    <div className="search-results" role="listbox" id="global-results" aria-label="검색 결과">
      {groups.map(group => <div className="search-group" role="group" aria-labelledby={`search-group-${group.id}`} key={group.id}>
        <div className="search-group-heading" id={`search-group-${group.id}`}>{group.label}<span>{group.items.length} / {group.total}</span></div>
        {group.items.map(result => <button role="option" aria-selected={result.id === activeId} id={`result-${result.id}`} tabIndex={-1} key={result.id} onMouseEnter={() => setActive(results.findIndex(item => item.id === result.id))} onClick={() => select(result.id)}>
          <span className="square-icon lavender"><result.icon size={17} /></span><span><strong>{result.title}</strong><small>{result.meta}</small></span><ArrowUpRight size={15} />
        </button>)}
      </div>)}
      {!results.length && <p className="search-empty" role="status">검색 결과가 없어요.</p>}
    </div>
    <div className="search-footer"><span><kbd>↑ ↓</kbd> 이동 <kbd>Enter</kbd> 열기</span><span><kbd>Esc</kbd> 닫기</span></div>
  </Modal>;
}
