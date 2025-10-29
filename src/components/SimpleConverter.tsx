import { useState, useRef } from 'react';
import { Upload, Copy, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { convertXmlToJson, detectFileType } from '../utils/converter';
import { useSettings } from '../contexts/SettingsContext';

interface SimpleConverterProps {
  onConvert: (xmlInput: string, result: string, conversionTime: number, fileType: string) => void;
}

export function SimpleConverter({ onConvert }: SimpleConverterProps) {
  const [xmlInput, setXmlInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [fileType, setFileType] = useState<'yxmd' | 'generic' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSettings();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setXmlInput(content);
        setError('');
      };
      reader.readAsText(file);
    }
  };

  const handleConvert = async () => {
    if (!xmlInput.trim()) {
      setError('Please enter XML content to convert');
      return;
    }

    setError('');
    setSuccess('');
    setIsConverting(true);
    
    const startTime = performance.now();

    try {
      const detectedType = detectFileType(xmlInput);
      setFileType(detectedType);

      const result = await convertXmlToJson(xmlInput, {
        preserveAttributes: settings.preserveAttributes,
        outputFormat: settings.outputFormat
      });
      
      const endTime = performance.now();
      const conversionTime = Math.round(endTime - startTime);

      setJsonOutput(result);
      
      let successMsg = `Conversion successful! (${conversionTime}ms)`;
      if (detectedType === 'yxmd') {
        successMsg += ' - Alteryx workflow detected';
      }
      setSuccess(successMsg);

      onConvert(xmlInput, result, conversionTime, detectedType);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to convert XML to JSON';
      setError(errorMsg);
    } finally {
      setIsConverting(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(jsonOutput);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* XML Input Section */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">XML Input</h3>
          {fileType && (
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 text-sm rounded">
              {fileType === 'yxmd' ? 'Alteryx Workflow' : 'Generic XML'}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <textarea
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            className="w-full h-64 bg-gray-900/50 border border-white/20 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
            placeholder="Paste your XML content here..."
          />

          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.yxmd,text/xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
            <button
              onClick={() => setXmlInput('')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
            >
              Clear
            </button>
            <button
              onClick={handleConvert}
              disabled={isConverting || !xmlInput.trim()}
              className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center justify-center gap-2"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Converting...
                </>
              ) : (
                'Convert to JSON'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* JSON Output Section */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">JSON Output</h3>
          {jsonOutput && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm">Ready</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <textarea
            value={jsonOutput}
            readOnly
            className="w-full h-64 bg-gray-900/50 border border-white/20 rounded-lg p-4 text-white font-mono text-sm resize-none"
            placeholder="JSON output will appear here..."
          />

          {jsonOutput && (
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={downloadJson}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}
    </div>
  );
}