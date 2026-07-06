import { useState, useEffect, useRef } from 'react';
import { formatFullDate } from '../utils/dateUtils';
import { METRICS, METRIC_DEFAULTS } from '../utils/metrics';
import Slider from './Slider';
import MicButton from './MicButton';
import { NoteIcon, PhotoPlusIcon } from './icons';
import { useAutoGrow } from '../hooks/useAutoGrow';
import { uploadPhoto, removePhotos, signedUrls } from '../lib/photos';
import PhotoFrame from './PhotoFrame';
import ConfirmModal from './ConfirmModal';

function pickMetrics(entry) {
  return Object.fromEntries(METRICS.map(m => [m.key, entry[m.key]]));
}

export default function AddEntryModal({ open, onClose, onSave, userId, initialEntry = null, selectedDate, focusKey = null }) {
  const [values, setValues] = useState(METRIC_DEFAULTS);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [highlight, setHighlight] = useState(null);

  // Zdjęcia: existingPhotos = zachowane ścieżki z wpisu; newFiles = wybrane, jeszcze niewgrane;
  // removedPaths = istniejące oznaczone do usunięcia (kasujemy w Storage dopiero po udanym zapisie).
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [existingUrls, setExistingUrls] = useState({}); // ścieżka → signed URL (podgląd)
  const [newFiles, setNewFiles] = useState([]);          // [{ id, file, previewUrl }]
  const [removedPaths, setRemovedPaths] = useState([]);
  const [photoError, setPhotoError] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null); // { kind: 'existing'|'new', key } | null
  const fileInputRef = useRef(null);

  // Przeciągnięcie sheetu w dół (mobile) → zamknięcie.
  const panelRef = useRef(null);
  const dragRef = useRef({ startY: 0, dy: 0, dragging: false });
  const [dragY, setDragY] = useState(0);
  const CLOSE_THRESHOLD = 100;

  // Referencje wierszy parametrów — do przewinięcia po kliknięciu konkretnego parametru.
  const rowRefs = useRef({});
  const noteRef = useRef(null);
  useAutoGrow(noteRef, note, 5);

  useEffect(() => {
    if (open) {
      // Edycja istniejącego dnia → prefill jego wartościami; nowy wpis → wartości domyślne.
      setValues(initialEntry ? pickMetrics(initialEntry) : METRIC_DEFAULTS);
      setNote(initialEntry?.note ?? '');
      setExistingPhotos(initialEntry?.photos ?? []);
      setPhotoError(null);
      setSaving(false);
      setDragY(0);
    }
  }, [open, initialEntry]);

  // Po zamknięciu: sprzątnij podglądy wybranych plików. Upload jeszcze nie nastąpił,
  // więc anulowanie okna nie zostawia sierot w Storage.
  useEffect(() => {
    if (!open) {
      setNewFiles(prev => { prev.forEach(nf => URL.revokeObjectURL(nf.previewUrl)); return []; });
      setRemovedPaths([]);
      setConfirmRemove(null);
    }
  }, [open]);

  // Signed URLs do podglądu istniejących zdjęć (bucket jest prywatny).
  useEffect(() => {
    let cancelled = false;
    const paths = initialEntry?.photos ?? [];
    if (!open || paths.length === 0) { setExistingUrls({}); return; }
    signedUrls(paths)
      .then(list => {
        if (cancelled) return;
        const map = {};
        for (const { path, url } of list) map[path] = url;
        setExistingUrls(map);
      })
      .catch(() => { if (!cancelled) setExistingUrls({}); });
    return () => { cancelled = true; };
  }, [open, initialEntry]);

  const handleFilePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewFiles(prev => [
        ...prev,
        ...files.map(file => ({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) })),
      ]);
    }
    e.target.value = ''; // pozwól ponownie wybrać ten sam plik
  };

  // Usuwanie zdjęcia zawsze po potwierdzeniu (setConfirmRemove otwiera dialog).
  const confirmRemovePhoto = () => {
    if (!confirmRemove) return;
    const { kind, key } = confirmRemove;
    if (kind === 'existing') {
      setExistingPhotos(prev => prev.filter(p => p !== key));
      setRemovedPaths(prev => [...prev, key]);
    } else {
      setNewFiles(prev => {
        const gone = prev.find(nf => nf.id === key);
        if (gone) URL.revokeObjectURL(gone.previewUrl);
        return prev.filter(nf => nf.id !== key);
      });
    }
    setConfirmRemove(null);
  };

  // Po otwarciu z konkretnym parametrem: przewiń do niego i chwilowo podświetl.
  useEffect(() => {
    if (!open || !focusKey) { setHighlight(null); return; }
    const t = setTimeout(() => {
      rowRefs.current[focusKey]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setHighlight(focusKey);
    }, 120);
    const clear = setTimeout(() => setHighlight(null), 2000);
    return () => { clearTimeout(t); clearTimeout(clear); };
  }, [open, focusKey]);

  const handleSave = async () => {
    setSaving(true);
    setPhotoError(null);
    try {
      // Upload wybranych plików dopiero teraz → brak sierot przy anulowaniu.
      const uploaded = [];
      for (const nf of newFiles) uploaded.push(await uploadPhoto(userId, nf.file));
      const finalPhotos = [...existingPhotos, ...uploaded];
      await onSave({ ...values, note: note.trim(), photos: finalPhotos });
      // Po udanym zapisie skasuj pliki oznaczone do usunięcia (nie blokuj UI błędem sprzątania).
      if (removedPaths.length) await removePhotos(removedPaths).catch(() => {});
    } catch (err) {
      setPhotoError(err?.message || 'Nie udało się zapisać zdjęć. Spróbuj ponownie.');
      setSaving(false);
    }
  };

  // Gest „pull-to-dismiss" — tylko ruch w dół.
  const onDragStart = (clientY) => {
    dragRef.current = { startY: clientY, dy: 0, dragging: true };
  };
  const onDragMove = (clientY) => {
    if (!dragRef.current.dragging) return;
    const dy = clientY - dragRef.current.startY;
    dragRef.current.dy = dy;
    setDragY(dy > 0 ? dy : 0);
  };
  const onDragEnd = () => {
    if (!dragRef.current.dragging) return;
    const dy = dragRef.current.dy;
    dragRef.current.dragging = false;
    if (dy > CLOSE_THRESHOLD) onClose();
    else setDragY(0);
  };

  const dateLabel = selectedDate ? formatFullDate(selectedDate) : (initialEntry ? 'Edytuj wpis' : 'Nowy wpis');

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet wrapper — pełnoekranowy kontener do centrowania na desktopie */}
      <div
        className={`fixed inset-0 z-50 flex items-end md:items-center md:justify-center
          ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {/* Panel */}
        <div
          ref={panelRef}
          className={`w-full bg-bg border border-border rounded-t-3xl ease-out
            md:w-[420px] md:rounded-3xl md:max-h-[90vh]
            ${dragY > 0 ? '' : 'transition-[transform,opacity] duration-300'}
            ${open ? 'opacity-100' : 'translate-y-full opacity-0 invisible'}`}
          style={open && dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
        >
          {/* Uchwyt (mobile) — strefa gestu przeciągnięcia w dół + data na górze + X */}
          <div
            className="relative flex items-center justify-center px-4 pt-5 pb-2 md:cursor-default touch-none"
            onTouchStart={e => onDragStart(e.touches[0].clientY)}
            onTouchMove={e => onDragMove(e.touches[0].clientY)}
            onTouchEnd={onDragEnd}
            onPointerDown={e => { if (e.pointerType !== 'touch') onDragStart(e.clientY); }}
            onPointerMove={e => { if (e.pointerType !== 'touch') onDragMove(e.clientY); }}
            onPointerUp={onDragEnd}
          >
            <div className="md:hidden absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 bg-border rounded-full" />
            <p className="text-txt font-display font-semibold text-base capitalize">{dateLabel}</p>
            <button
              onClick={onClose}
              aria-label="Zamknij"
              className="absolute right-3 top-3 flex items-center justify-center w-8 h-8 rounded-full bg-elevated text-txt-2 hover:text-txt transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-[80vh] px-4 pb-7 pt-2">
            {/* Lista parametrów: etykieta z lewej, suwak + wartość z prawej */}
            <div className="bg-surface border border-border rounded-2xl px-4 divide-y divide-border mb-3">
              {METRICS.map(m => (
                <div
                  key={m.key}
                  ref={el => { rowRefs.current[m.key] = el; }}
                  className={`flex items-center gap-3 py-3 -mx-4 px-4 rounded-xl transition-colors ${
                    highlight === m.key ? 'bg-elevated ring-1 ring-inset' : ''
                  }`}
                  style={highlight === m.key ? { '--tw-ring-color': m.color } : undefined}
                >
                  <div className="flex items-center gap-2 w-28 shrink-0">
                    <span style={{ color: m.color }}><m.Icon size={18} /></span>
                    <span className="text-txt text-sm font-medium">{m.label}</span>
                  </div>
                  <Slider
                    value={values[m.key]}
                    onChange={e => setValues(prev => ({ ...prev, [m.key]: Number(e.target.value) }))}
                    className="flex-1 min-w-0"
                  />
                  <span className="w-9 text-right text-sm font-mono font-semibold tabular-nums" style={{ color: m.color }}>
                    {values[m.key]}
                  </span>
                </div>
              ))}
            </div>

            {/* Notatka — zdjęcia nad treścią; „+" (zdjęcie) i mikrofon na wysokości etykiety */}
            <div className="bg-surface border border-border rounded-2xl p-4 mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="flex items-center gap-1.5 text-txt-3 text-xs font-medium uppercase tracking-wide">
                  <span className="text-[#0E7490]"><NoteIcon size={14} /></span>
                  Notatka
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Dodaj zdjęcie"
                    title="Dodaj zdjęcie"
                    style={{ width: 28, height: 28 }}
                    className="rounded-full flex items-center justify-center shrink-0 bg-elevated text-txt-3 hover:text-txt transition-colors"
                  >
                    <PhotoPlusIcon size={15} />
                  </button>
                  <MicButton getText={() => note} onText={(joined) => setNote(joined)} size={28} iconSize={15} />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilePick}
                className="hidden"
              />
              {(existingPhotos.length > 0 || newFiles.length > 0) && (
                <div className="flex flex-col items-center gap-2 mb-3">
                  {existingPhotos.map(path => (
                    <PhotoFrame
                      key={path}
                      src={existingUrls[path]}
                      onRemove={() => setConfirmRemove({ kind: 'existing', key: path })}
                    />
                  ))}
                  {newFiles.map(nf => (
                    <PhotoFrame
                      key={nf.id}
                      src={nf.previewUrl}
                      onRemove={() => setConfirmRemove({ kind: 'new', key: nf.id })}
                    />
                  ))}
                </div>
              )}
              {photoError && <p className="text-danger text-xs mb-2">{photoError}</p>}
              <textarea
                ref={noteRef}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Co dzisiaj czujesz? Jak był trening?"
                className="w-full bg-transparent text-txt placeholder-txt-3 text-[11px] resize-none outline-none leading-relaxed pr-2 md:text-justify"
                rows={1}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl font-semibold text-base transition-opacity bg-recovery text-bg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Zapisywanie…' : 'Zapisz wpis'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmRemove}
        title="Czy na pewno chcesz usunąć to zdjęcie?"
        onCancel={() => setConfirmRemove(null)}
        onConfirm={confirmRemovePhoto}
      />
    </>
  );
}
