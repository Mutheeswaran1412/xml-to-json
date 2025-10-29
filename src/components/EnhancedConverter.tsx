import { useState, useRef, useEffect } from 'react';
import { Upload, Copy, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { convertXmlToJson, detectFileType, validateXmlSyntax } from '../utils/converter';
import { useSettings } from '../contexts/SettingsContext';

interface EnhancedConverterProps {
  onConvert: (xmlInput: string, result: string, conversionTime: number, fileType: string) => void;
}

export function EnhancedConverter({ onConvert }: EnhancedConverterProps) {
  const [xmlInput, setXmlInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{line: number, message: string}>>([]);
  const [fileType, setFileType] = useState<'yxmd' | 'generic' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSettings();

  // Real-time validation
  useEffect(() => {
    if (xmlInput.trim()) {
      const errors = validateXmlSyntax(xmlInput);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  }, [xmlInput]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const xmlFile = files.find(file => 
      file.name.endsWith('.xml') || 
      file.name.endsWith('.yxmd') || 
      file.type === 'text/xml'
    );
    
    if (xmlFile) {
      handleFileRead(xmlFile);
    } else {
      setError('Please drop a valid XML or YXMD file');
    }
  };

  const handleFileRead = (file: File) => {
    if (file.size > settings.maxFileSize * 1024) {
      setError(`File size exceeds ${settings.maxFileSize}KB limit`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setXmlInput(content);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const handleConvert = async () => {
    if (!xmlInput.trim()) {
      setError('Please enter XML content to convert');
      return;
    }

    if (validationErrors.length > 0) {
      setError('Please fix XML syntax errors before converting');
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
        try {
          const parsed = JSON.parse(result);
          successMsg += ` - Alteryx workflow: ${parsed.tools?.length || 0} tools, ${parsed.connections?.length || 0} connections`;
        } catch {
          successMsg += ' - Alteryx workflow detected';
        }
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

  const downloadJson = (minified = false) => {
    const content = minified ? JSON.stringify(JSON.parse(jsonOutput)) : jsonOutput;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted${minified ? '-minified' : ''}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const highlightXml = (xml: string) => {
    return xml
      .replace(/(&lt;[^&gt;]+&gt;)/g, '<span class="text-blue-400">$1</span>')
      .replace(/(&quot;[^&quot;]*&quot;)/g, '<span class="text-green-400">$1</span>')
      .replace(/(=)/g, '<span class="text-yellow-400">$1</span>');
  };

  const highlightJson = (json: string) => {
    return json
      .replace(/("[\w]+"):/g, '<span class="text-blue-400">$1</span>:')
      .replace(/: (".*?")/g, ': <span class="text-green-400">$1</span>')
      .replace(/: (true|false|null)/g, ': <span class="text-purple-400">$1</span>')
      .replace(/: (\d+)/g, ': <span class="text-orange-400">$1</span>');
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-[600px]">
      {/* XML Input Panel */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">XML Input</h3>
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{validationErrors.length} errors</span>
            </div>
          )}
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 border-2 border-dashed rounded-lg p-4 transition-all relative ${
            isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-white/20 hover:border-white/30'
          }`}
        >
          <div className="h-full flex flex-col">
            <textarea
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              className="flex-1 bg-gray-900/50 rounded p-3 font-mono text-sm text-white resize-none border-none outline-none"
              placeholder="Paste your XML content here or drag & drop files..."
            />
            {!xmlInput && (
              <div className="absolute inset-4 flex flex-col items-center justify-center pointer-events-none">
                <Upload className="w-8 h-8 text-gray-500 mb-2" />
                <p className="text-gray-400 text-sm">Paste XML or drop files here</p>
              </div>
            )}
            {validationErrors.length > 0 && (
              <div className="mt-2 max-h-20 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-red-400 text-xs">
                    Line {error.line}: {error.message}
                  </div>
                ))}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.yxmd,text/xml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Input Controls */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setXmlInput('')}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
          >
            Clear
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Browse File
          </button>
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                setXmlInput(text);
                setError('');
              } catch {
                setError('Failed to read clipboard. Please paste manually.');
              }
            }}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
          >
            Paste Text
          </button>
          <button
            onClick={handleConvert}
            disabled={isConverting || !xmlInput.trim() || validationErrors.length > 0}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm flex items-center justify-center gap-2"
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

      {/* JSON Output Panel */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium">JSON Output</h3>
            {fileType && (
              <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 text-xs rounded">
                {fileType === 'yxmd' ? 'Alteryx Workflow' : 'Generic XML'}
              </span>
            )}
          </div>
          {jsonOutput && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Ready</span>
            </div>
          )}
        </div>

        {/* JSON Display */}
        <div className="flex-1 border border-white/20 rounded-lg overflow-hidden">
          {jsonOutput ? (
            <div 
              className="h-full bg-gray-900/50 p-3 font-mono text-sm overflow-auto"
              dangerouslySetInnerHTML={{ __html: highlightJson(jsonOutput) }}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>JSON output will appear here</p>
            </div>
          )}
        </div>

        {/* Output Controls */}
        {jsonOutput && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={() => downloadJson(false)}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              <Download className="w-4 h-4" />
              Pretty
            </button>
            <button
              onClick={() => downloadJson(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
            >
              <Download className="w-4 h-4" />
              Minified
            </button>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}