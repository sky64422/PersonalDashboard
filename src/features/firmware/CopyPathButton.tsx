// Copy/check transition adapted from Lucian UX/UI Prompt #008. MIT © 2026 Seokwoooo.
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CopyPathButton({ path, label, notify }: { path: string; label: string; notify: (message: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  async function copy() {
    setPending(true);
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      notify('예시 경로를 복사했습니다. 실제 파일 경로는 아닙니다.');
    } catch {
      setCopied(false);
      notify('경로를 복사하지 못했습니다. 경로 텍스트를 직접 선택해 복사해주세요.');
    } finally { setPending(false); }
  }
  return <button className="button secondary copy-button" aria-label={label} data-copied={copied} disabled={pending} onClick={() => void copy()} onBlur={() => setCopied(false)}>
    <span className="copy-glyph" aria-hidden="true"><Copy className="copy-original" size={14} /><Check className="copy-confirm" size={15} /></span><span>{pending ? '복사 중' : copied ? '복사됨' : '경로 복사'}</span>
  </button>;
}
