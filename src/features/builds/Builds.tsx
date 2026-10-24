import { memo, useRef, useState } from 'react';
import { ArrowRight, Box, GitBranch, Layers3, Play } from 'lucide-react';
import type { Build, BuildRequest } from '../../data/model';
import { BUILD_PROFILES, BUILD_TARGETS } from '../../data/demo';
import { Modal, PanelHeading, StatusBadge } from '../../components/ui';
import { validateBuildRequest } from './validation';

export const Builds = memo(function Builds({ builds, onSubmit, onSelect }: { builds: Build[]; onSubmit: (request: BuildRequest) => void; onSelect: (build: Build) => void }) {
  const [request, setRequest] = useState<BuildRequest>({ target: BUILD_TARGETS[0], branch: 'release/2.4.0', profile: BUILD_PROFILES[0] });
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const submitting = useRef(false);
  const branchInput = useRef<HTMLInputElement>(null);
  function review() {
    const issue = validateBuildRequest(request);
    setError(issue);
    if (issue && !request.branch.trim()) branchInput.current?.focus();
    if (!issue) { submitting.current = false; setConfirm(true); }
  }
  function submit() {
    if (submitting.current) return;
    submitting.current = true;
    onSubmit({ ...request, branch: request.branch.trim() });
    setConfirm(false);
  }
  return <>
    <section className="card build-form"><PanelHeading title="새로운 빌드" action={<span className="square-icon lavender"><Layers3 size={20} /></span>} />
      <form onSubmit={e => { e.preventDefault(); review(); }} noValidate>
        <div className="form-grid"><label>빌드 대상<select value={request.target} onChange={e => setRequest({ ...request, target: e.target.value })}>{BUILD_TARGETS.map(target => <option key={target}>{target}</option>)}</select></label><label>프로필<select value={request.profile} onChange={e => setRequest({ ...request, profile: e.target.value })}>{BUILD_PROFILES.map(profile => <option key={profile}>{profile}</option>)}</select></label></div>
        <label className="field-label">브랜치<div className="input-with-icon"><GitBranch size={16} /><input ref={branchInput} aria-invalid={!!error && !request.branch.trim()} aria-describedby={error ? 'build-error' : undefined} aria-label="브랜치" value={request.branch} onChange={e => { setRequest({ ...request, branch: e.target.value }); setError(null); }} placeholder="예: release/2.4.0" /></div></label>
        {error && <p id="build-error" className="form-error" role="alert">{error}</p>}
        <div className="form-bottom"><button className="button primary" type="submit"><Play size={14} />빌드 검토</button></div>
      </form>
    </section>
    <section className="card"><PanelHeading title="Build history" action={<span className="count-pill">{builds.length}</span>} />
      <div className="table-scroll"><table className="build-table"><thead><tr><th>빌드 / 대상</th><th>브랜치</th><th>프로필</th><th>상태</th><th>소요 시간</th><th>상세</th></tr></thead><tbody>{builds.map(build => <tr key={build.id}><td><div className="table-identity"><span className={`square-icon ${build.status === 'Failed' ? 'rose' : 'mint'}`}><Box size={18} /></span><span><strong>{build.target}</strong><small>{build.id}</small></span></div></td><td><span className="branch-label"><GitBranch size={13} />{build.branch}</span></td><td>{build.profile}</td><td><StatusBadge status={build.status} /></td><td className="mono">{build.duration}</td><td><button className="icon-button" aria-label={`${build.id} 상세`} onClick={() => onSelect(build)}><ArrowRight size={16} /></button></td></tr>)}</tbody></table></div>
    </section>
    <Modal open={confirm} onClose={() => setConfirm(false)} title="빌드 설정 확인"><div className="confirmation"><dl className="detail-fields"><div><dt>대상</dt><dd>{request.target}</dd></div><div><dt>브랜치</dt><dd>{request.branch}</dd></div><div><dt>프로필</dt><dd>{request.profile}</dd></div></dl><div className="dialog-actions"><button className="button secondary" onClick={() => setConfirm(false)}>돌아가기</button><button className="button primary" onClick={submit}>데모 빌드 추가<ArrowRight size={15} /></button></div></div></Modal>
  </>;
});

export const BuildDetails = memo(function BuildDetails({ build, onClose }: { build: Build | null; onClose: () => void }) {
  return <Modal open={!!build} onClose={onClose} title={build?.id ?? 'Build'} panel>{build && <div className="task-details"><StatusBadge status={build.status} /><h2>{build.target}</h2><dl className="detail-fields"><div><dt>브랜치</dt><dd>{build.branch}</dd></div><div><dt>프로필</dt><dd>{build.profile}</dd></div><div><dt>생성 시각</dt><dd>{new Date(build.createdAt).toLocaleString('ko-KR')}</dd></div><div><dt>소요 시간</dt><dd>{build.duration}</dd></div></dl></div>}</Modal>;
});
