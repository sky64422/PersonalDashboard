import { useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, Box, FileBox, Search, SquareCheck } from 'lucide-react';
import { Modal } from './ui';
import type { Task, Build, FirmwareArtifact } from '../data/model';
export function GlobalSearch({ open, onClose, tasks, builds, firmware, onTask, onBuild, onFirmware }: { open: boolean; onClose: () => void; tasks: Task[]; builds: Build[]; firmware: FirmwareArtifact[]; onTask: (task: Task) => void; onBuild: (build: Build) => void; onFirmware: (record: FirmwareArtifact) => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const normalized = query.trim().toLocaleLowerCase();
  const results = [
    ...tasks.map(task => ({ id: task.id, title: task.title, meta: `${task.key} · My Tasks`, icon: SquareCheck, action: () => onTask(task) })),
    ...builds.map(build => ({ id: build.id, title: `${build.target} · ${build.branch}`, meta: `${build.id} · Builds`, icon: Box, action: () => onBuild(build) })),
    ...firmware.map(record => ({ id: record.id, title: record.filename, meta: `${record.model} · Firmware`, icon: FileBox, action: () => onFirmware(record) })),
  ].filter(result => `${result.title} ${result.meta}`.toLocaleLowerCase().includes(normalized)).slice(0, 8);
  const activeIndex = Math.min(active, Math.max(0, results.length - 1));
  function select(index: number) { const result = results[index]; if (result) { onClose(); result.action(); } }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
    } else if (event.key === 'Enter') { event.preventDefault(); select(activeIndex); }
    else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); setActive(event.key === 'Home' ? 0 : results.length - 1); }
  }
  return <Modal open={open} onClose={onClose} title="무엇을 찾고 있나요?" description="내 업무, 빌드, 펌웨어를 한 번에 검색하세요."><div className="global-search-field"><Search size={19} /><input role="combobox" aria-expanded={open} aria-controls="global-results" aria-activedescendant={results.length ? `result-${results[activeIndex].id}` : undefined} aria-autocomplete="list" aria-label="통합 검색어" placeholder="업무 이름, 빌드 또는 펌웨어 검색…" value={query} onChange={e => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKeyDown} autoFocus /></div><div className="search-results" role="listbox" id="global-results" aria-label="검색 결과">{results.map((result, index) => <button role="option" aria-selected={index === activeIndex} id={`result-${result.id}`} tabIndex={-1} key={result.id} onMouseEnter={() => setActive(index)} onClick={() => select(index)}><span className="square-icon lavender"><result.icon size={18} /></span><span><strong>{result.title}</strong><small>{result.meta}</small></span><ArrowUpRight size={16} /></button>)}{!results.length && <p className="search-empty" role="status">검색 결과가 없어요. 다른 검색어를 입력해주세요.</p>}</div><div className="search-footer"><span><kbd>↑ ↓</kbd> 이동 <kbd>Enter</kbd> 열기</span><span><kbd>Esc</kbd> 닫기</span></div></Modal>;
}
