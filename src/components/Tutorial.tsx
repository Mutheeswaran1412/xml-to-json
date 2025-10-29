import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, BookOpen, FileCode2, Upload, Download } from 'lucide-react';

interface TutorialStep {
  title: string;
  content: string;
  example?: string;
  action?: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to XML to JSON Converter",
    content: "This interactive tutorial will guide you through all the features of our XML to JSON converter. You'll learn how to convert files, use advanced features, and optimize your workflow.",
    action: "Let's get started!"
  },
  {
    title: "Basic XML Conversion",
    content: "Start by pasting your XML content into the input area or uploading an XML file. The converter automatically detects the file type and applies the appropriate parsing strategy.",
    example: `<bookstore>
  <book id="1">
    <title>XML Guide</title>
    <author>John Doe</author>
    <price currency="USD">29.99</price>
  </book>
</bookstore>`,
    action: "Try pasting this XML example"
  },
  {
    title: "Alteryx Workflow Support",
    content: "Our converter has specialized support for Alteryx .yxmd workflow files. It extracts tools, connections, metadata, and workflow properties into a structured JSON format.",
    example: `<?xml version="1.0"?>
<AlteryxDocument yxmdVer="2023.1">
  <Nodes>
    <Node ToolID="1">
      <GuiSettings Plugin="AlteryxBasePluginsGui.DbFileInput.DbFileInput" />
    </Node>
  </Nodes>
</AlteryxDocument>`,
    action: "Upload a .yxmd file to see the enhanced parsing"
  },
  {
    title: "Bulk Processing",
    content: "Process multiple XML files at once using the Bulk Converter. Drag and drop multiple files, track conversion progress, and download all results as a ZIP file.",
    action: "Navigate to Bulk Convert tab"
  },
  {
    title: "Advanced Settings",
    content: "Customize your conversion experience with advanced settings. Control attribute handling, output formatting, performance modes, and file filters.",
    action: "Press Ctrl+, to open settings"
  },
  {
    title: "Keyboard Shortcuts",
    content: "Speed up your workflow with keyboard shortcuts. Convert files instantly, access settings quickly, and navigate efficiently.",
    example: `Ctrl+Enter - Convert XML
Ctrl+, - Open Settings  
Ctrl+/ - Show Shortcuts`,
    action: "Press Ctrl+/ to see all shortcuts"
  },
  {
    title: "Conversion History & Analytics",
    content: "Track all your conversions with detailed history and analytics. Search, filter, export data, and monitor your usage patterns with visual charts.",
    action: "Check the History tab for your conversion analytics"
  },
  {
    title: "Export Options",
    content: "Download your converted JSON in multiple formats: pretty-printed for readability, minified for production, or compact for balanced size.",
    action: "Try the different download options"
  }
];

export function Tutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  if (!isActive) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
          <BookOpen className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-4">Interactive Tutorial</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Learn how to use all the features of the XML to JSON converter with our step-by-step interactive tutorial. 
            Perfect for new users and those wanting to discover advanced features.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-lg p-4">
              <FileCode2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="text-white font-medium mb-1">Basic Conversion</h3>
              <p className="text-gray-400 text-sm">Learn XML to JSON conversion basics</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-medium mb-1">Advanced Features</h3>
              <p className="text-gray-400 text-sm">Bulk processing, settings, and more</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <Download className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="text-white font-medium mb-1">Export & Analytics</h3>
              <p className="text-gray-400 text-sm">History, analytics, and export options</p>
            </div>
          </div>
          
          <button
            onClick={startTutorial}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg mx-auto transition-colors"
          >
            <Play className="w-5 h-5" />
            Start Interactive Tutorial
          </button>
        </div>
      </div>
    );
  }

  const step = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">{step.title}</h2>
                <p className="text-sm text-gray-400">Step {currentStep + 1} of {tutorialSteps.length}</p>
              </div>
            </div>
            <button
              onClick={() => setIsActive(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
            
            <p className="text-gray-300 leading-relaxed mb-4">{step.content}</p>
            
            {step.example && (
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <h4 className="text-white font-medium mb-2">Example:</h4>
                <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {step.example}
                </pre>
              </div>
            )}
            
            {step.action && (
              <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-3">
                <p className="text-blue-300 font-medium">💡 Try this: {step.action}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <div className="flex gap-2">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}