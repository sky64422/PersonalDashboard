import * as Dialog from '@radix-ui/react-dialog';
import { Check, Circle, CircleDashed, Clock3, Search, X, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import type { Priority } from '../data/model';

export function Modal({ open, onClose, title, description, children, panel = false }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; panel?: boolean }) {
  const returnFocus = useRef<HTMLElement | null>(null);
  const lastContent = useRef({ title, description, children });
  useLayoutEffect(() => { if (open) lastContent.current = { title, description, children }; }, [open, title, description, children]);
  const content = open ? { title, description, children } : lastContent.current;
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) onClose(); }}>
    <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className={panel ? 'dialog-content detail-panel' : 'dialog-content'}
      onOpenAutoFocus={() => { returnFocus.current = document.activeElement as HTMLElement; }}
      onCloseAutoFocus={event => {
        event.preventDefault();
        const target = returnFocus.current;
        if (target?.isConnected && !target.closest('[role="dialog"][data-state="closed"]')) target.focus();
        else document.querySelector<HTMLElement>('nav [aria-current="page"]')?.focus();
      }}>
      <div className="dialog-heading"><div><Dialog.Title>{content.title}</Dialog.Title><Dialog.Description>{content.description ?? '샘플 데이터를 사용하는 미리보기입니다.'}</Dialog.Description></div><Dialog.Close className="icon-button" aria-label="닫기"><X size={19} /></Dialog.Close></div>
      {content.children}
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
const STATUS_CLASS: Record<string, string> = { 'In Progress': 'purple', 'In Review': 'amber', 'To Do': 'neutral', Done: 'green', Success: 'green', Failed: 'red', Queued: 'purple' };
export function StatusBadge({ status }: { status: string }) {
  const Icon = status === 'Success' || status === 'Done' ? Check : status === 'Queued' ? Clock3 : status === 'In Progress' ? CircleDashed : Circle;
  return <span className={`status-badge ${STATUS_CLASS[status] ?? 'neutral'}`}><Icon size={12} />{status}</span>;
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  const Icon = priority === 'High' ? ArrowUp : priority === 'Medium' ? Minus : ArrowDown;
  return <span className={`priority priority-${priority.toLowerCase()}`}><Icon size={13} />{priority}</span>;
}
export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (value: string) => void; placeholder: string; label: string }) {
  return <div className="search-input"><Search size={16} /><input aria-label={label} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} />{value && <button className="icon-button small" onClick={() => onChange('')} aria-label={`${label} 지우기`}><X size={14} /></button>}</div>;
}
export function EmptyState({ onReset }: { onReset?: () => void }) {
  return <div className="empty-state"><Search size={28} /><h3>검색 결과가 없어요</h3><p>검색어나 필터를 바꿔 다시 찾아보세요.</p>{onReset && <button className="button secondary" onClick={onReset}>필터 초기화</button>}</div>;
}
export function PanelHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}
