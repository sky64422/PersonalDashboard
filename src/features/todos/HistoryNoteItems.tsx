import { memo, useMemo, useState } from 'react';
import { Check, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import type { DailyTodoLogEntry } from './todoModel';

const COLLAPSED_ITEM_COUNT = 5;
const COLLAPSE_LABEL = '접기';

export const HistoryNoteItems = memo(function HistoryNoteItems({ entry }: { entry: DailyTodoLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const records = useMemo(() => [
    ...entry.completedOnDay.map(item => ({ item, completed: true })),
    ...entry.addedOnDay.filter(item => !(item.done && item.completedAtDate === entry.date))
      .map(item => ({ item, completed: false })),
  ], [entry]);

  const hiddenCount = Math.max(0, records.length - COLLAPSED_ITEM_COUNT);
  const listId = `history-items-${entry.date}`;
  const displayedRecords = expanded ? records : records.slice(0, COLLAPSED_ITEM_COUNT);

  return <>
    <ul id={listId} className="hanging-note-list">
      {displayedRecords.map(({ item, completed }) => (
        <li key={item.id} className={`hanging-note-item ${completed ? 'is-done-note' : 'is-carry-note'}`}>
          {completed ? <Check size={12} className="event-icon done" /> : <CornerDownRight size={12} className="event-icon carry" />}
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
    {hiddenCount > 0 && <button type="button" className="history-note-expand" aria-expanded={expanded} aria-controls={listId}
      onClick={() => setExpanded(value => !value)}>
      {expanded ? COLLAPSE_LABEL : `외 ${hiddenCount}개 더 보기`}
      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>}
  </>;
});
