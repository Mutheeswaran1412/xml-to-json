import { useState } from 'react';
import { Upload, Download, X, FileCode2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { convertXmlToJson } from '../utils/converter';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FileConversion {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'success' | 'error';
  jsonOutput?: string;
  error?: string;
}

export function BulkConverter() {
  const { user } = useAuth();
  const [conversions, setConversions] = useState<FileConversion[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newConversions: FileConversion[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
    }));

    setConversions(prev => [...prev, ...newConversions]);
  };

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
    handleFileSelect(e.dataTransfer.files);
  };

  const convertAll = async () => {
    for (const conversion of conversions) {
      if (conversion.status !== 'pending') continue;

      setConversions(prev =>
        prev.map(c => c.id === conversion.id ? { ...c, status: 'converting' } : c)
      );

      try {
        const xmlContent = await conversion.file.text();
        const startTime = performance.now();
        const jsonOutput = await convertXmlToJson(xmlContent);
        const endTime = performance.now();
        const conversionTime = Math.round(endTime - startTime);

        setConversions(prev =>
          prev.map(c =>
            c.id === conversion.id
              ? { ...c, status: 'success', jsonOutput }
              : c
          )
        );

        if (user) {
          await supabase.from('conversions').insert({
            user_id: user.id,
            filename: conversion.file.name,
            xml_input: xmlContent,
            json_output: jsonOutput,
            file_size: conversion.file.size,
            conversion_time_ms: conversionTime,
            status: 'success',
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Conversion failed';
        setConversions(prev =>
          prev.map(c =>
            c.id === conversion.id
              ? {
                  ...c,
                  status: 'error',
                  error: errorMsg,
                }
              : c
          )
        );

        if (user) {
          await supabase.from('conversions').insert({
            user_id: user.id,
            filename: conversion.file.name,
            xml_input: await conversion.file.text(),
            json_output: null,
            file_size: conversion.file.size,
            conversion_time_ms: 0,
            status: 'error',
            error_message: errorMsg,
          });
        }
      }
    }
  };

  const downloadAll = () => {
    conversions
      .filter(c => c.status === 'success' && c.jsonOutput)
      .forEach(conversion => {
        const blob = new Blob([conversion.jsonOutput!], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = conversion.file.name.replace(/\.xml$/, '.json');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  };

  const removeFile = (id: string) => {
    setConversions(prev => prev.filter(c => c.id !== id));
  };

  const clearAll = () => {
    setConversions([]);
  };

  const successCount = conversions.filter(c => c.status === 'success').length;
  const errorCount = conversions.filter(c => c.status === 'error').length;
  const pendingCount = conversions.filter(c => c.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="bg-black/20 px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Bulk File Converter</h2>
          <p className="text-gray-400 text-sm mt-1">Convert multiple XML files at once{!user && ' (Sign in to save history)'}</p>
        </div>

        <div className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/20 hover:border-white/30'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">
              Drag and drop XML files here
            </p>
            <p className="text-gray-400 text-sm mb-4">or</p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xml,text/xml,.yxmd"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <span className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                Select Files
              </span>
            </label>
          </div>

          {conversions.length > 0 && (
            <>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">
                    Total: <strong className="text-white">{conversions.length}</strong>
                  </span>
                  {successCount > 0 && (
                    <span className="text-green-400">
                      Success: <strong>{successCount}</strong>
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="text-red-400">
                      Failed: <strong>{errorCount}</strong>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {pendingCount > 0 && (
                    <button
                      onClick={convertAll}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Convert All
                    </button>
                  )}
                  {successCount > 0 && (
                    <button
                      onClick={downloadAll}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download All
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {conversions.map((conversion) => (
                  <div
                    key={conversion.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileCode2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {conversion.file.name}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {(conversion.file.size / 1024).toFixed(1)} KB
                        </p>
                        {conversion.error && (
                          <p className="text-red-400 text-sm mt-1">{conversion.error}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {conversion.status === 'pending' && (
                        <span className="text-gray-400 text-sm">Pending</span>
                      )}
                      {conversion.status === 'converting' && (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      )}
                      {conversion.status === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {conversion.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <button
                        onClick={() => removeFile(conversion.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
