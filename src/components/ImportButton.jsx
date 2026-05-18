import { useRef, useState } from 'react'
import { importFromJson, importFromExcel } from '../utils/importData'
import ImportPreviewModal from './ImportPreviewModal'

export default function ImportButton({ onImport, label = '导入', className = '' }) {
  const inputRef = useRef(null)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null)   // { name, data } waiting for confirmation
  const [pendingIsExcel, setPendingIsExcel] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    setError(null)

    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'json') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          setPending(importFromJson(e.target.result))
          setPendingIsExcel(false)
        } catch (err) {
          setError(err.message)
        }
      }
      reader.readAsText(file)
      return
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          setPending(importFromExcel(e.target.result))
          setPendingIsExcel(true)
        } catch (err) {
          setError(err.message)
        }
      }
      reader.readAsArrayBuffer(file)
      return
    }

    setError('仅支持 .json 或 .xlsx 文件')
  }

  const handleChange = (e) => {
    handleFile(e.target.files[0])
    e.target.value = ''
  }

  const handleConfirm = (result) => {
    setPending(null)
    onImport(result)
  }

  return (
    <span className={`import-btn-wrap ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <button
        className="btn-ghost import-btn"
        onClick={() => { setError(null); inputRef.current?.click() }}
        title="从 JSON 备份或 Excel 文件导入"
      >
        {label}
      </button>
      {error && (
        <span className="import-error" role="alert">
          {error}
        </span>
      )}
      {pending && (
        <ImportPreviewModal
          importResult={pending}
          isExcel={pendingIsExcel}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
    </span>
  )
}
