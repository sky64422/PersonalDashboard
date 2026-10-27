import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui';
import { CalendarConflictError } from './calendarStorage';
import {
  CALENDAR_COPY as C,
  CALENDAR_MIN_DATE,
  CALENDAR_MAX_DATE,
  EVENT_TITLE_LIMIT,
  EVENT_NOTES_LIMIT,
  DEFAULT_EVENT_START,
  DEFAULT_EVENT_END,
  validateEvent,
  type CalendarEvent,
} from './calendarModel';

export function EventEditor({
  initial,
  existing,
  onSave,
  onSaveCopy,
  onDelete,
  onClose,
}: {
  initial: CalendarEvent;
  existing: boolean;
  onSave: (event: CalendarEvent) => Promise<void>;
  onSaveCopy: (event: CalendarEvent) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<'discard' | 'delete' | null>(null);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  function close() {
    if (saving) return;
    if (dirty) setConfirmation('discard');
    else onClose();
  }

  function update(patch: Partial<CalendarEvent>) {
    setDraft(current => ({ ...current, ...patch }));
    setError('');
    setConfirmation(null);
  }

  async function commit(copy = false) {
    if (saving) return;
    const message = validateEvent(draft);
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    try {
      await (copy ? onSaveCopy : onSave)({
        ...draft,
        title: draft.title.trim(),
        start: draft.allDay ? '' : draft.start,
        end: draft.allDay ? '' : draft.end,
      });
    } catch (failure) {
      setConflict(failure instanceof CalendarConflictError);
      setError(failure instanceof CalendarConflictError ? C.conflict : C.saveError);
    } finally {
      setSaving(false);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void commit();
  }

  async function remove() {
    if (saving) return;
    setSaving(true);
    try {
      await onDelete(initial.id);
    } catch {
      setError(C.saveError);
      setConfirmation(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={close} onForceClose={onClose} title={existing ? C.edit : C.add}>
      <form className="calendar-editor" onSubmit={submit} noValidate aria-busy={saving}>
        <fieldset disabled={saving} className="calendar-editor-fields">
          <label>
            {C.title}
            <input
              autoFocus
              value={draft.title}
              onChange={e => update({ title: e.target.value })}
              maxLength={EVENT_TITLE_LIMIT}
              placeholder={C.titlePlaceholder}
              required
            />
          </label>

          <div className="calendar-form-row">
            <label>
              {C.date}
              <input
                type="date"
                value={draft.date}
                min={CALENDAR_MIN_DATE}
                max={CALENDAR_MAX_DATE}
                onChange={e => update({ date: e.target.value })}
                required
              />
            </label>
            <label className="calendar-all-day">
              <input
                type="checkbox"
                checked={draft.allDay}
                onChange={e =>
                  update({
                    allDay: e.target.checked,
                    start: draft.start || DEFAULT_EVENT_START,
                    end: draft.end || DEFAULT_EVENT_END,
                  })
                }
              />
              <span>{C.allDay}</span>
            </label>
          </div>

          {!draft.allDay && (
            <div className="calendar-form-row">
              <label>
                {C.start}
                <input
                  type="time"
                  value={draft.start}
                  onChange={e => update({ start: e.target.value })}
                  required
                />
              </label>
              <label>
                {C.end}
                <input
                  type="time"
                  value={draft.end}
                  onChange={e => update({ end: e.target.value })}
                  required
                />
              </label>
            </div>
          )}

          <label>
            {C.notes}
            <textarea
              aria-label={C.notes}
              rows={3}
              maxLength={EVENT_NOTES_LIMIT}
              value={draft.notes}
              onChange={e => update({ notes: e.target.value })}
              placeholder={C.notesPlaceholder}
            />
          </label>

          {error && (
            <p className="calendar-error" role="alert">
              {error}
            </p>
          )}

          {conflict && (
            <div className="calendar-conflict">
              <p>{C.copyHint}</p>
              <button type="button" className="button secondary" onClick={() => void commit(true)}>
                {C.saveCopy}
              </button>
            </div>
          )}

          {confirmation ? (
            <div
              className="calendar-confirm"
              role="group"
              aria-label={confirmation === 'delete' ? C.deleteConfirm : C.discard}
            >
              <p>{confirmation === 'delete' ? C.deleteConfirm : C.discard}</p>
              <div>
                <button type="button" className="button secondary" onClick={() => setConfirmation(null)}>
                  {C.keepEditing}
                </button>
                <button
                  type="button"
                  className="button calendar-danger"
                  onClick={confirmation === 'delete' ? remove : onClose}
                >
                  {confirmation === 'delete' ? C.deleteAction : C.discardAction}
                </button>
              </div>
            </div>
          ) : (
            <div className="calendar-form-actions">
              {existing && (
                <button type="button" className="calendar-delete" onClick={() => setConfirmation('delete')}>
                  <Trash2 size={14} />
                  {C.remove}
                </button>
              )}
              <span />
              <button type="button" className="button secondary" onClick={close}>
                {C.cancel}
              </button>
              <button className="button primary" type="submit">
                {C.save}
              </button>
            </div>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
