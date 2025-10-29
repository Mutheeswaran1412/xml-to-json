import { useState } from 'react';
import { Search, BookOpen, Video, MessageCircle, HelpCircle, ExternalLink } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  views: number;
}

interface VideoGuide {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  description: string;
}

export function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'articles' | 'videos' | 'faq'>('articles');

  const articles: Article[] = [
    {
      id: '1',
      title: 'Getting Started with XML to JSON Conversion',
      category: 'basics',
      content: 'Learn the fundamentals of converting XML files to JSON format using our converter...',
      tags: ['beginner', 'xml', 'json'],
      views: 1250
    },
    {
      id: '2',
      title: 'Advanced Alteryx Workflow Processing',
      category: 'alteryx',
      content: 'Discover how to leverage specialized Alteryx .yxmd file processing features...',
      tags: ['alteryx', 'workflow', 'advanced'],
      views: 890
    },
    {
      id: '3',
      title: 'Bulk Conversion Best Practices',
      category: 'bulk',
      content: 'Optimize your bulk conversion workflows for maximum efficiency and reliability...',
      tags: ['bulk', 'performance', 'tips'],
      views: 675
    },
    {
      id: '4',
      title: 'API Integration Guide',
      category: 'api',
      content: 'Complete guide to integrating our REST API into your applications...',
      tags: ['api', 'integration', 'development'],
      views: 543
    },
    {
      id: '5',
      title: 'Troubleshooting Common Issues',
      category: 'troubleshooting',
      content: 'Solutions to frequently encountered problems and error messages...',
      tags: ['troubleshooting', 'errors', 'support'],
      views: 432
    }
  ];

  const videoGuides: VideoGuide[] = [
    {
      id: '1',
      title: 'XML to JSON Converter Overview',
      duration: '5:30',
      thumbnail: '🎥',
      description: 'Complete walkthrough of all features and capabilities'
    },
    {
      id: '2',
      title: 'Alteryx Workflow Conversion Demo',
      duration: '8:15',
      thumbnail: '🔧',
      description: 'Step-by-step guide to converting Alteryx .yxmd files'
    },
    {
      id: '3',
      title: 'Bulk Processing Tutorial',
      duration: '6:45',
      thumbnail: '📊',
      description: 'How to efficiently process multiple XML files at once'
    },
    {
      id: '4',
      title: 'API Integration Examples',
      duration: '12:20',
      thumbnail: '⚡',
      description: 'Real-world examples of API integration in different languages'
    }
  ];

  const faqs = [
    {
      question: 'What file formats are supported?',
      answer: 'We support .xml files, .yxmd (Alteryx workflow) files, and any text files containing valid XML content. Maximum file size is 2MB per file.'
    },
    {
      question: 'Is my data secure during conversion?',
      answer: 'Yes, all conversions happen client-side in your browser. Your XML data never leaves your device during the conversion process.'
    },
    {
      question: 'Can I use the converter offline?',
      answer: 'Yes, our PWA (Progressive Web App) allows core conversion functionality to work offline once the app is loaded.'
    },
    {
      question: 'How do I integrate with the API?',
      answer: 'Check our API documentation tab for complete integration guides, code examples, and authentication details.'
    },
    {
      question: 'What makes Alteryx support special?',
      answer: 'Our specialized Alteryx parser extracts workflow tools, connections, metadata, and preserves the semantic structure of .yxmd files.'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Articles', count: articles.length },
    { id: 'basics', name: 'Getting Started', count: articles.filter(a => a.category === 'basics').length },
    { id: 'alteryx', name: 'Alteryx', count: articles.filter(a => a.category === 'alteryx').length },
    { id: 'api', name: 'API', count: articles.filter(a => a.category === 'api').length },
    { id: 'troubleshooting', name: 'Troubleshooting', count: articles.filter(a => a.category === 'troubleshooting').length }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Knowledge Base</h2>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search articles, guides, and FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1">
          {[
            { id: 'articles', name: 'Articles', icon: BookOpen },
            { id: 'videos', name: 'Video Guides', icon: Video },
            { id: 'faq', name: 'FAQ', icon: HelpCircle }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <h3 className="text-white font-medium mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-xs">{category.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Articles List */}
            <div className="lg:col-span-3 space-y-4">
              {filteredArticles.map(article => (
                <div key={article.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-medium mb-2">{article.title}</h4>
                  <p className="text-gray-400 text-sm mb-3">{article.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {article.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{article.views} views</span>
                      <button className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                        Read More <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          <div className="grid md:grid-cols-2 gap-6">
            {videoGuides.map(video => (
              <div key={video.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{video.thumbnail}</div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">{video.title}</h4>
                    <p className="text-gray-400 text-sm mb-2">{video.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{video.duration}</span>
                      <button className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                        <Video className="w-3 h-3" />
                        Watch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  {faq.question}
                </h4>
                <p className="text-gray-400 pl-6">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-8 bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <h4 className="text-blue-300 font-medium">Need More Help?</h4>
          </div>
          <p className="text-blue-200 text-sm mb-3">
            Can't find what you're looking for? Our support team is here to help!
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}