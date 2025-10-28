import { useState } from 'react';
import { User, ArrowLeft, Menu, X } from 'lucide-react';
import { convertXmlToJson, detectFileType } from './utils/converter';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ConversionHistory } from './components/ConversionHistory';
import { BulkConverter } from './components/BulkConverter';

type ViewMode = 'converter' | 'history' | 'bulk';

function App() {
  const { user, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ViewMode>('converter');
  const [xmlInput, setXmlInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [fileType, setFileType] = useState<'yxmd' | 'generic' | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleConvert = async () => {
    setError('');
    setSuccess('');
    setJsonOutput('');

    if (!xmlInput.trim()) {
      setError('Please enter XML content to convert');
      return;
    }

    setIsConverting(true);
    const startTime = performance.now();

    try {
      const detectedType = detectFileType(xmlInput);
      setFileType(detectedType);

      const result = await convertXmlToJson(xmlInput);
      const endTime = performance.now();
      const conversionTime = Math.round(endTime - startTime);

      setJsonOutput(result);
      setSuccess(`Conversion successful! (${conversionTime}ms)${detectedType === 'yxmd' ? ' - Alteryx workflow detected' : ''}`);

      if (user) {
        await supabase.from('conversions').insert({
          user_id: user.id,
          filename: 'Manual Input',
          xml_input: xmlInput,
          json_output: result,
          file_size: new Blob([xmlInput]).size,
          conversion_time_ms: conversionTime,
          status: 'success',
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to convert XML to JSON';
      setError(errorMsg);

      if (user) {
        await supabase.from('conversions').insert({
          user_id: user.id,
          filename: 'Manual Input',
          xml_input: xmlInput,
          json_output: null,
          file_size: new Blob([xmlInput]).size,
          conversion_time_ms: 0,
          status: 'error',
          error_message: errorMsg,
        });
      }
    } finally {
      setIsConverting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setXmlInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setActiveView('converter');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20 py-4">
            <div className="flex items-center gap-3">
              <img src="./images/trinity-logo.webp" alt="Trinity Logo" className="w-40 h-16" />
            </div>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden text-white p-2"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="hidden lg:flex items-center gap-6">
              <button
                onClick={() => setActiveView('converter')}
                className={`text-sm font-medium transition-colors ${
                  activeView === 'converter' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Converter
              </button>
              <button
                onClick={() => setActiveView('bulk')}
                className={`text-sm font-medium transition-colors ${
                  activeView === 'bulk' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Bulk Convert
              </button>
              <button
                onClick={() => setActiveView('history')}
                className={`text-sm font-medium transition-colors ${
                  activeView === 'history' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                History
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg border border-white/20">
                    <User className="w-4 h-4 text-white" />
                    <span className="text-sm text-white">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>

          {showMobileMenu && (
            <div className="lg:hidden py-4 space-y-2">
              <button
                onClick={() => { setActiveView('converter'); setShowMobileMenu(false); }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  activeView === 'converter' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                Converter
              </button>
              <button
                onClick={() => { setActiveView('bulk'); setShowMobileMenu(false); }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  activeView === 'bulk' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                Bulk Convert
              </button>
              <button
                onClick={() => { setActiveView('history'); setShowMobileMenu(false); }}
                className={`block w-full text-left px-4 py-2 rounded-lg ${
                  activeView === 'history' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                History
              </button>
              {!user && (
                <button
                  onClick={() => { setShowAuthModal(true); setShowMobileMenu(false); }}
                  className="block w-full text-left px-4 py-2 bg-orange-500 text-white rounded-lg"
                >
                  Get Started
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {activeView === 'converter' && (
          <div className="max-w-5xl mx-auto">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Tools</span>
            </button>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  XML to JSON Converter
                </h1>
                <p className="text-gray-400 text-lg mb-8">
                  Easily convert any XML (Extensible Markup Language) file or snippet to JSON (Javascript Object Notation) with trinity, a low-code workflow automation tool.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <label className="block text-white text-lg font-medium mb-4">
                  XML to convert
                </label>

                <div className="relative">
                  <textarea
                    value={xmlInput}
                    onChange={(e) => setXmlInput(e.target.value)}
                    placeholder='[&#10;  {&#10;    "Index": "1",&#10;    "User Id": "88F7B33d2bcf9f5",&#10;    "First Name": "Shelby",&#10;    "Last Name": "Terrell"&#10;  }&#10;]'
                    className="w-full h-64 bg-purple-950/50 border border-purple-500/30 rounded-xl p-4 text-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    spellCheck={false}
                  />

                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                    <span>Alternatively, drop or</span>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".xml,text/xml,.yxmd"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors">
                        upload
                      </span>
                    </label>
                    <span>xml file here (max 2mb)</span>
                  </div>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={isConverting || !xmlInput.trim()}
                  className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                >
                  {isConverting ? 'Converting...' : 'Convert XML to JSON'}
                </button>

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

                {jsonOutput && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-white text-lg font-medium">JSON Output</label>
                      {fileType && (
                        <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-300 text-xs font-medium rounded">
                          {fileType === 'yxmd' ? 'Alteryx Workflow' : 'Generic XML'}
                        </span>
                      )}
                    </div>
                    <pre className="w-full h-64 bg-purple-950/50 border border-purple-500/30 rounded-xl p-4 text-gray-300 font-mono text-sm overflow-auto">
                      {jsonOutput}
                    </pre>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(jsonOutput);
                          setSuccess('Copied to clipboard!');
                          setTimeout(() => setSuccess(''), 2000);
                        }}
                        className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([jsonOutput], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'converted.json';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="mt-16 pt-8 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm mb-2">
                Trinity Technology Solutions - XML to JSON Converter
              </p>
            </footer>
          </div>
        )}

        {activeView === 'bulk' && <BulkConverter />}
        {activeView === 'history' && <ConversionHistory />}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}

export default App;
