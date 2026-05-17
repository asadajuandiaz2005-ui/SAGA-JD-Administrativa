import { useState } from 'react';
import { LuX, LuFileText, LuMap, LuUpload } from 'react-icons/lu';

interface SubirArchivosMedidorModalProps {
  isOpen: boolean;
  numeroMedidor: number | string;
  onClose: () => void;
  onSubir: (certFile: File | null, planosFile: File | null) => Promise<void>;
  onSuccess?: () => void;
}

interface FileFieldProps {
  label: string;
  icon: React.ReactNode;
  file: File | null;
  onChange: (f: File | null) => void;
}

const FileField = ({ label, icon, file, onChange }: FileFieldProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className={`w-full px-3 py-2.5 border rounded-lg bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors ${file ? 'border-green-400' : 'border-gray-300'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={file ? 'text-green-600' : 'text-gray-400'}>{icon}</span>
          <span className={`text-sm truncate ${file ? 'text-gray-800' : 'text-gray-400'}`}>
            {file ? file.name : 'Seleccionar archivo...'}
          </span>
        </div>
        <span className="bg-blue-500 text-white px-3 py-1 rounded text-xs shrink-0 ml-2">
          {file ? 'Cambiar' : 'Subir'}
        </span>
      </div>
    </div>
  </div>
);

const SubirArchivosMedidorModal = ({
  isOpen,
  numeroMedidor,
  onClose,
  onSubir,
  onSuccess,
}: SubirArchivosMedidorModalProps) => {
  const [certFile, setCertFile] = useState<File | null>(null);
  const [planosFile, setPlanosFile] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    if (guardando) return;
    setCertFile(null);
    setPlanosFile(null);
    setErrorMsg(null);
    onClose();
  };

  const handleSubir = async () => {
    if (!certFile && !planosFile) {
      setErrorMsg('Debe subir al menos un archivo.');
      return;
    }
    setGuardando(true);
    setErrorMsg(null);
    try {
      await onSubir(certFile, planosFile);
      setCertFile(null);
      setPlanosFile(null);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al subir los archivos.';
      setErrorMsg(msg);
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <LuUpload className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Subir Archivos al Medidor</h2>
              <p className="text-xs text-gray-500">
                Medidor <span className="font-semibold text-blue-700">#{numeroMedidor}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={guardando}
            className="p-1.5 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <LuX className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500">
            Suba uno o ambos documentos del terreno. Este medidor fue asignado sin archivos.
          </p>

          <FileField
            label="Certificación Literal"
            icon={<LuFileText className="w-4 h-4" />}
            file={certFile}
            onChange={setCertFile}
          />

          <FileField
            label="Planos del Terreno"
            icon={<LuMap className="w-4 h-4" />}
            file={planosFile}
            onChange={setPlanosFile}
          />

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={handleSubir}
            disabled={guardando || (!certFile && !planosFile)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {guardando ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                Subiendo...
              </>
            ) : (
              <>
                <LuUpload className="w-3.5 h-3.5" />
                Subir Archivos
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            disabled={guardando}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubirArchivosMedidorModal;
