import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, MoreHorizontal, Bookmark, Share2, ArrowLeft, ExternalLink, Clock, Plus, Check, X, Moon, Sun } from 'lucide-react';

const MinimalDigestApp = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('main');
  const [userFeeds, setUserFeeds] = useState(['techcrunch.com', 'r/productivity', 'theverge.com']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Dynamic theme classes
  const theme = {
    background: isDarkMode ? 'bg-gray-900' : 'bg-stone-50',
    cardBg: isDarkMode ? 'bg-gray-800' : 'bg-stone-100',
    headerBg: isDarkMode ? 'bg-gray-800' : 'bg-stone-100',
    text: isDarkMode ? 'text-gray-100' : 'text-stone-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-stone-600',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-stone-500',
    border: isDarkMode ? 'border-gray-700' : 'border-stone-200',
    borderLight: isDarkMode ? 'border-gray-600' : 'border-stone-300',
    hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-stone-200',
    hoverCard: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-stone-200',
    accent: isDarkMode ? 'bg-gray-700' : 'bg-stone-800',
    accentText: isDarkMode ? 'text-gray-100' : 'text-stone-100',
    accentHover: isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-stone-700',
    pill: isDarkMode ? 'bg-gray-700' : 'bg-stone-200',
    pillText: isDarkMode ? 'text-gray-200' : 'text-stone-700',
    divider: isDarkMode ? 'bg-gray-600' : 'bg-stone-300'
  };

  // Source Icon Components
  const TechCrunchIcon = () => (
    <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
      <span className="text-white text-xs font-bold">TC</span>
    </div>
  );

  const RedditIcon = () => (
    <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
      <span className="text-white text-xs font-bold">r</span>
    </div>
  );

  const TheVergeIcon = () => (
    <div className="w-4 h-4 bg-purple-600 rounded-sm flex items-center justify-center">
      <span className="text-white text-xs font-bold">V</span>
    </div>
  );

  const YouTubeIcon = () => (
    <div className="w-4 h-4 bg-red-500 rounded-sm flex items-center justify-center">
      <span className="text-white text-xs font-bold">▶</span>
    </div>
  );

  const BloombergIcon = () => (
    <div className="w-4 h-4 bg-blue-900 rounded-sm flex items-center justify-center">
      <span className="text-white text-xs font-bold">B</span>
    </div>
  );

  const WiredIcon = () => (
    <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
      <span className="text-white text-xs font-bold">W</span>
    </div>
  );

  const getSourceIcon = (source) => {
    if (source.includes('techcrunch')) return <TechCrunchIcon />;
    if (source.includes('r/')) return <RedditIcon />;
    if (source.includes('theverge')) return <TheVergeIcon />;
    if (source === 'Fireship' || source === 'Ali Abdaal') return <YouTubeIcon />;
    if (source.includes('bloomberg')) return <BloombergIcon />;
    if (source.includes('wired')) return <WiredIcon />;
    return <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>;
  };

  const categories = ['All', 'News', 'Tech', 'Reddit', 'YouTube'];

  const templatePacks = [
    {
      id: 1,
      name: 'Tech Entrepreneur',
      description: 'Stay ahead with startup news, tech trends, and business insights',
      feeds: ['techcrunch.com', 'theverge.com', 'r/startups', 'r/entrepreneur', 'Bloomberg Tech', 'Y Combinator'],
      subscribers: '12.3k',
      isPopular: true
    },
    {
      id: 2,
      name: 'ADHD Focus',
      description: 'Productivity tips, focus techniques, and neurodivergent-friendly content',
      feeds: ['r/ADHD', 'r/productivity', 'ADDitude Magazine', 'How to ADHD', 'r/getmotivated'],
      subscribers: '8.7k',
      isPopular: false
    },
    {
      id: 3,
      name: 'Developer Daily',
      description: 'Programming tutorials, tech news, and developer community discussions',
      feeds: ['dev.to', 'r/programming', 'Hacker News', 'GitHub Trending', 'CSS-Tricks', 'Fireship'],
      subscribers: '15.1k',
      isPopular: true
    }
  ];

  const availableFeeds = {
    news: [
      { name: 'TechCrunch', url: 'techcrunch.com', description: 'Startup and technology news' },
      { name: 'The Verge', url: 'theverge.com', description: 'Technology, science, art, and culture' },
      { name: 'Bloomberg', url: 'bloomberg.com', description: 'Business and financial news' },
      { name: 'Wired', url: 'wired.com', description: 'Future-focused technology reporting' }
    ],
    youtube: [
      { name: 'Fireship', url: 'Fireship', description: 'Web development tutorials and tech news' },
      { name: 'Ali Abdaal', url: 'Ali Abdaal', description: 'Productivity and learning strategies' },
      { name: 'MKBHD', url: 'MKBHD', description: 'Tech reviews and consumer electronics' }
    ],
    reddit: [
      { name: 'r/programming', url: 'r/programming', description: 'Computer programming discussions' },
      { name: 'r/startups', url: 'r/startups', description: 'Startup community and advice' },
      { name: 'r/productivity', url: 'r/productivity', description: 'Productivity tips and techniques' },
      { name: 'r/ADHD', url: 'r/ADHD', description: 'ADHD support and strategies' }
    ],
    twitter: [
      { name: '@naval', url: '@naval', description: 'Entrepreneur and investor insights' },
      { name: '@sama', url: '@sama', description: 'OpenAI CEO thoughts on AI' }
    ],
    newsletters: [
      { name: 'Morning Brew', url: 'morningbrew.com', description: 'Business news in digestible format' },
      { name: 'The Hustle', url: 'thehustle.co', description: 'Business and tech trends' }
    ]
  };

  const items = [
    {
      id: 1,
      category: 'News',
      source: 'techcrunch.com',
      time: 'Today 14:30',
      title: 'The Neural Revolution',
      subtitle: 'Companies report 40% productivity gains with new AI-assisted development environments.',
      isBookmarked: false
    },
    {
      id: 2,
      category: 'Reddit',
      source: 'r/productivity',
      time: 'Today 13:15',
      title: 'Mindful Productivity',
      subtitle: 'Community highlights focus tools and habit trackers for neurodivergent users.',
      isBookmarked: true
    },
    {
      id: 3,
      category: 'Tech',
      source: 'theverge.com',
      time: 'Today 12:45',
      title: 'Quantum Horizons',
      subtitle: 'New wave of collaboration software prioritizes async communication.',
      isBookmarked: false
    },
    {
      id: 4,
      category: 'YouTube',
      source: 'Fireship',
      time: 'Today 11:20',
      title: 'Code & Creativity',
      subtitle: 'Deep dive into optimization strategies for mobile app performance.',
      isBookmarked: false
    },
    {
      id: 5,
      category: 'News',
      source: 'bloomberg.com',
      time: 'Today 10:55',
      title: 'Sustainable Innovation',
      subtitle: 'Q3 investments in green technology surpass $8.2B.',
      isBookmarked: true
    },
    {
      id: 6,
      category: 'Tech',
      source: 'wired.com',
      time: 'Today 08:15',
      title: 'Biotech Frontiers',
      subtitle: 'How pair programming with AI assistants is changing development.',
      isBookmarked: false
    }
  ];

  const getAllFeeds = () => {
    return Object.values(availableFeeds).flat();
  };

  const addFeed = (feedUrl) => {
    if (!userFeeds.includes(feedUrl)) {
      setUserFeeds([...userFeeds, feedUrl]);
    }
  };

  const removeFeed = (feedUrl) => {
    setUserFeeds(userFeeds.filter(feed => feed !== feedUrl));
  };

  const addTemplatePack = (pack) => {
    const newFeeds = pack.feeds.filter(feed => !userFeeds.includes(feed));
    setUserFeeds([...userFeeds, ...newFeeds]);
  };

  const filteredItems = activeCategory === 'All' ? items : items.filter(item => item.category === activeCategory);

  const openArticle = (item) => {
    setSelectedArticle(item);
    setIsDetailOpen(true);
  };

  const closeArticle = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedArticle(null), 300);
  };

  // Template Packs Screen
  const TemplatePacksScreen = () => (
    <div className={`h-screen ${theme.background}`}>
      <div className={`${theme.headerBg} ${theme.border} border-b px-4 py-3`}>
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentScreen('feeds')} className={`p-2 ${theme.hover} rounded transition-colors`}>
            <ArrowLeft size={20} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
          </button>
          <h1 className={`${theme.text} font-semibold text-lg`}>Template Packs</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-4 pb-24 overflow-y-auto h-full">
        <p className={`${theme.textSecondary} text-sm mb-6`}>Quick-start your feed with curated collections</p>
        {templatePacks.map((pack) => (
          <div key={pack.id} className={`${theme.cardBg} rounded-lg p-4 mb-4 border ${theme.border}`}>
            <div className="flex items-center mb-1">
              <h3 className={`${theme.text} font-semibold text-base`}>{pack.name}</h3>
              {pack.isPopular && (
                <span className={`ml-2 px-2 py-0.5 ${theme.accent} ${theme.accentText} text-xs rounded-full`}>Popular</span>
              )}
            </div>
            <p className={`${theme.textSecondary} text-sm mb-3 leading-relaxed`}>{pack.description}</p>
            <div className={`flex items-center text-xs ${theme.textMuted} mb-3`}>
              <span>{pack.feeds.length} sources</span>
              <span className="mx-2">•</span>
              <span>{pack.subscribers} subscribers</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {pack.feeds.slice(0, 3).map((feed) => (
                <span key={feed} className={`px-2 py-1 ${theme.pill} text-xs ${theme.pillText} rounded`}>{feed}</span>
              ))}
              {pack.feeds.length > 3 && (
                <span className={`px-2 py-1 ${theme.pill} text-xs ${theme.textMuted} rounded`}>+{pack.feeds.length - 3} more</span>
              )}
            </div>
            <button onClick={() => addTemplatePack(pack)} className={`w-full ${theme.accent} ${theme.accentText} py-2 rounded-lg text-sm font-medium ${theme.accentHover} transition-colors`}>
              Add Pack
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Add Feed Screen
  const AddFeedScreen = () => {
    const sections = [
      { key: 'news', title: 'News & Articles', icon: '📰' },
      { key: 'youtube', title: 'YouTube', icon: '📺' },
      { key: 'reddit', title: 'Reddit', icon: '🔴' },
      { key: 'twitter', title: 'Twitter/X', icon: '🐦' },
      { key: 'newsletters', title: 'Newsletters', icon: '📧' }
    ];

    return (
      <div className={`h-screen ${theme.background}`}>
        <div className={`${theme.headerBg} ${theme.border} border-b px-4 py-3`}>
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentScreen('feeds')} className={`p-2 ${theme.hover} rounded transition-colors`}>
              <ArrowLeft size={20} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
            </button>
            <h1 className={`${theme.text} font-semibold text-lg`}>Add Sources</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <div className="p-4 pb-24 overflow-y-auto h-full">
          {sections.map((section) => (
            <div key={section.key} className="mb-6">
              <div className="flex items-center mb-3">
                <span className="text-xl mr-2">{section.icon}</span>
                <h3 className={`${theme.text} font-semibold text-base`}>{section.title}</h3>
              </div>
              
              {(availableFeeds[section.key] || []).map((feed) => {
                const isAdded = userFeeds.includes(feed.url);
                return (
                  <div key={feed.url} className={`${theme.cardBg} rounded-lg p-3 mb-2 flex items-center justify-between`}>
                    <div className="flex items-center flex-1">
                      <div className="mr-3">{getSourceIcon(feed.url)}</div>
                      <div>
                        <h4 className={`${theme.text} font-medium text-sm`}>{feed.name}</h4>
                        <p className={`${theme.textSecondary} text-xs leading-relaxed`}>{feed.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => isAdded ? removeFeed(feed.url) : addFeed(feed.url)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isAdded ? `${theme.accent} ${theme.accentText}` : `${theme.pill} ${theme.pillText} border ${theme.borderLight}`
                      }`}
                    >
                      {isAdded ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Feeds Management Screen
  const FeedsScreen = () => (
    <div className={`h-screen ${theme.background}`}>
      <div className={`${theme.headerBg} ${theme.border} border-b px-4 py-3`}>
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentScreen('main')} className={`p-2 ${theme.hover} rounded transition-colors`}>
            <ArrowLeft size={20} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
          </button>
          <h1 className={`${theme.text} font-semibold text-lg`}>Your Feeds</h1>
          <button onClick={() => setCurrentScreen('add-feed')} className={`p-2 ${theme.hover} rounded transition-colors`}>
            <Plus size={20} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
          </button>
        </div>
      </div>

      <div className="p-4 pb-24 overflow-y-auto h-full">
        <div className="mb-6">
          <button onClick={() => setCurrentScreen('template-packs')} className={`w-full ${theme.cardBg} border-2 border-dashed ${theme.borderLight} rounded-lg p-4 text-center`}>
            <div className="text-2xl mb-2">📦</div>
            <div className={`${theme.text} font-semibold text-sm mb-1`}>Browse Template Packs</div>
            <div className={`${theme.textSecondary} text-xs`}>Quick-start with curated collections</div>
          </button>
        </div>

        <h2 className={`${theme.text} font-semibold text-base mb-3`}>Active Sources ({userFeeds.length})</h2>
        {userFeeds.map((feedUrl) => {
          const feedInfo = getAllFeeds().find(f => f.url === feedUrl);
          return (
            <div key={feedUrl} className={`${theme.cardBg} rounded-lg p-4 mb-3 border ${theme.border} flex items-center justify-between`}>
              <div className="flex items-center flex-1">
                <div className="mr-3">{getSourceIcon(feedUrl)}</div>
                <div>
                  <h3 className={`${theme.text} font-medium text-sm`}>{feedInfo?.name || feedUrl}</h3>
                  <p className={`${theme.textSecondary} text-xs`}>{feedInfo?.description || 'Custom Source'}</p>
                </div>
              </div>
              <button onClick={() => removeFeed(feedUrl)} className={`p-2 ${theme.hover} rounded-lg transition-colors`}>
                <X size={16} color={isDarkMode ? "#9ca3af" : "#78716c"} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const CardItem = ({ item }) => {
    const [isBookmarked, setIsBookmarked] = useState(item.isBookmarked);
    
    return (
      <div onClick={() => openArticle(item)} className={`${theme.cardBg} rounded-lg mb-3 p-4 shadow-sm border ${theme.border} hover:shadow-md transition-all cursor-pointer`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className={`flex items-center text-xs ${theme.textMuted} mb-2`}>
              <div className="mr-2">{getSourceIcon(item.source)}</div>
              <span className="font-medium">{item.source}</span>
              <span className="mx-2">•</span>
              <span>{item.time}</span>
            </div>
            <h3 className={`${theme.text} font-medium text-base leading-5 mb-1 italic`} style={{fontFamily: 'Georgia, "Times New Roman", Times, serif'}}>{item.title}</h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsBookmarked(!isBookmarked);
            }}
            className={`p-1 ml-3 ${theme.hover} rounded transition-colors`}
          >
            <Bookmark size={16} color={isBookmarked ? (isDarkMode ? "#e5e7eb" : "#44403c") : (isDarkMode ? "#9ca3af" : "#78716c")} fill={isBookmarked ? (isDarkMode ? "#e5e7eb" : "#44403c") : "none"} />
          </button>
        </div>
        <p className={`${theme.textSecondary} text-xs leading-4 mb-3`}>{item.subtitle}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-5 h-1 ${theme.divider} rounded`}></div>
            <div className={`w-5 h-1 ${theme.divider} rounded`}></div>
            <div className={`w-5 h-1 ${theme.divider} rounded`}></div>
          </div>
          <button onClick={(e) => e.stopPropagation()} className={`p-1 ${theme.hover} rounded transition-colors`}>
            <Share2 size={14} color={isDarkMode ? "#9ca3af" : "#78716c"} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`max-w-sm mx-auto ${theme.background} min-h-screen relative`}>
      {currentScreen === 'feeds' && <FeedsScreen />}
      {currentScreen === 'template-packs' && <TemplatePacksScreen />}
      {currentScreen === 'add-feed' && <AddFeedScreen />}
      
      {currentScreen === 'main' && (
        <div className="h-screen flex flex-col">
          <div className={`${theme.headerBg} ${theme.border} border-b`}>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center">
                <div className={`w-6 h-6 ${theme.accent} rounded mr-3 flex items-center justify-center`}>
                  <div className={`w-3 h-3 ${isDarkMode ? 'bg-gray-800' : 'bg-stone-100'} rounded-sm`}></div>
                </div>
                <h1 className={`${theme.text} font-bold text-lg`}>Aggregator</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={toggleDarkMode} className={`p-2 ${theme.hover} rounded transition-colors`}>
                  {isDarkMode ? <Sun size={18} color="#e5e7eb" /> : <Moon size={18} color="#44403c" />}
                </button>
                <button className={`p-2 ${theme.hover} rounded transition-colors`}>
                  <Search size={18} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
                </button>
                <button className={`p-2 ${theme.hover} rounded transition-colors`}>
                  <RotateCcw size={18} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
                </button>
                <button className={`p-2 ${theme.hover} rounded transition-colors`}>
                  <MoreHorizontal size={18} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
                </button>
              </div>
            </div>

            <div className="px-4 pb-3">
              <div className="flex space-x-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === category ? `${theme.accent} ${theme.accentText}` : `${theme.pill} ${theme.pillText} ${theme.hover}`
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pb-24">
            {filteredItems.map((item) => (
              <CardItem key={item.id} item={item} />
            ))}
            
            <div className="text-center py-8">
              <div className={`w-8 h-1 ${theme.divider} rounded mx-auto`}></div>
            </div>
          </div>

          <div className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm ${theme.headerBg} ${theme.border} border-t`}>
            <div className="flex justify-center space-x-8 py-3">
              {[
                { icon: '●', active: currentScreen === 'main', screen: 'main' },
                { icon: '○', active: false, screen: 'saved' },
                { icon: '△', active: currentScreen === 'feeds', screen: 'feeds' },
                { icon: '□', active: false, screen: 'profile' }
              ].map((nav, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentScreen(nav.screen)}
                  className={`text-lg transition-colors ${nav.active ? theme.text : theme.textMuted}`}
                >
                  {nav.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedArticle && (
        <div className={`absolute inset-0 ${theme.headerBg} transition-transform duration-300 ease-out ${isDetailOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className={`${theme.headerBg} ${theme.border} border-b px-4 py-3`}>
            <div className="flex items-center justify-between">
              <button onClick={closeArticle} className={`p-2 ${theme.hover} rounded transition-colors`}>
                <ArrowLeft size={20} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
              </button>
              <div className="flex items-center space-x-2">
                <button className={`p-2 ${theme.hover} rounded transition-colors`}>
                  <Bookmark size={18} color={isDarkMode ? "#9ca3af" : "#78716c"} />
                </button>
                <button className={`p-2 ${theme.hover} rounded transition-colors`}>
                  <Share2 size={18} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
                </button>
                <button className={`p-2 ${theme.hover} rounded transition-colors`}>
                  <ExternalLink size={18} color={isDarkMode ? "#e5e7eb" : "#44403c"} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto h-full">
            <div className="flex items-center mb-4">
              <div className="mr-3">{getSourceIcon(selectedArticle.source)}</div>
              <div>
                <div className={`flex items-center text-sm ${theme.textSecondary}`}>
                  <span className="font-medium">{selectedArticle.source}</span>
                  <span className="mx-2">•</span>
                  <span>{selectedArticle.time}</span>
                </div>
              </div>
            </div>

            <h1 className={`text-xl font-medium ${theme.text} leading-7 mb-3 italic`} style={{fontFamily: 'Georgia, "Times New Roman", Times, serif'}}>{selectedArticle.title}</h1>
            <p className={`${theme.textSecondary} text-base leading-6 mb-6`}>{selectedArticle.subtitle}</p>
            
            <div className="prose prose-sm max-w-none">
              <p className={`${theme.textSecondary} leading-6`}>
                This is where the full article content would be displayed. The article detail view provides 
                a clean, distraction-free reading experience optimized for focus and comprehension.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinimalDigestApp;