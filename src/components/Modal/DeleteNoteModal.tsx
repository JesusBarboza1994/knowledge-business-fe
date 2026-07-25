import { useState } from "react";
import { uniqueLinks, extractNoteLinks } from "../../lib/wiki";
import { Trash2, TriangleAlert } from "lucide-react";
import { Note } from "../../types";

export function DeleteNoteDialog({
  note,
  notes,
  onClose,
  onConfirm,
}: {
  note: Note;
  notes: Note[];
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const outgoing = uniqueLinks(extractNoteLinks(note, notes)).length;
  const incoming = notes.filter(
    (candidate) =>
      !candidate.archived &&
      candidate.id !== note.id &&
      extractNoteLinks(candidate, notes).some(
        (link) => link.target?.id === note.id,
      ),
  ).length;
  const total = outgoing + incoming;
  async function confirm() {
    setLoading(true);
    setError("");
    try {
      await onConfirm();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No se pudo eliminar la nota.",
      );
      setLoading(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-lg p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 flex-none place-items-center rounded-xl border border-danger/25 bg-danger/10 text-danger">
            <TriangleAlert size={19} />
          </div>
          <div>
            <p className="eyebrow text-danger">Acción destructiva</p>
            <h2 className="mt-1 text-lg font-medium">
              Eliminar “{note.title}”
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              La nota dejará de estar disponible. Las referencias que otras
              notas le hacen se quedarán como enlaces pendientes: si vuelves a
              crearla con el mismo nombre, se reconectan solas.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-line bg-sunken p-3 text-center">
          <div>
            <strong className="block text-base text-fg">
              {incoming}
            </strong>
            <span className="text-2xs text-muted">
              Referencias entrantes
            </span>
          </div>
          <div>
            <strong className="block text-base text-fg">
              {outgoing}
            </strong>
            <span className="text-2xs text-muted">Enlaces salientes</span>
          </div>
          <div>
            <strong className="block text-base text-danger">{total}</strong>
            <span className="text-2xs text-muted">Conexiones afectadas</span>
          </div>
        </div>
        {error && (
          <p className="mt-4 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="secondary-button"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="danger-button"
            onClick={() => void confirm()}
            disabled={loading}
          >
            {loading ? (
              <span className="loader dark" />
            ) : (
              <>
                <Trash2 size={14} /> Archivar nota
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
