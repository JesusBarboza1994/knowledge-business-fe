import { BookOpen } from "lucide-react";
import { useState } from "react";

export function NewNoteDialog({
  areaName,
  onClose,
  onCreate,
}: {
  areaName: string;
  onClose: () => void;
  onCreate: (title: string) => void;
}) {
  const [title, setTitle] = useState("");

  return (
    <div className="modal-backdrop">
      <form
        className="modal-card max-w-md p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim()) void onCreate(title.trim());
        }}
      >
        <p className="eyebrow">Nueva nota · {areaName}</p>
        <h2 className="mt-1 text-lg font-medium">¿Qué quieres documentar?</h2>
        <label className="mt-6 block">
          <span className="field-label">Título</span>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="field"
            placeholder="Ej. Estrategia de búsqueda"
          />
        </label>
        <p className="mt-2 text-xs text-muted">
          El slug se generará automáticamente a partir del título.
        </p>
        <div
          role="note"
          className="mt-4 flex gap-3 rounded-lg border border-accent/20 bg-accent/5 px-3 py-3"
        >
          <BookOpen size={16} className="mt-0.5 flex-none text-accent" />
          <div>
            <p className="text-xs font-medium text-fg">
              Recuerda revisar el índice del área
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Si esta nota debe ser fácil de descubrir, agrégala manualmente al
              índice correspondiente.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" disabled={!title.trim()}>
            Crear nota
          </button>
        </div>
      </form>
    </div>
  );
}
