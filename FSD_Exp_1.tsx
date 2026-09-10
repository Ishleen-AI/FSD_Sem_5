import React, { useState, useEffect } from 'react';
import { 
  Twitter, 
  Facebook, 
  Linkedin, 
  Instagram, 
  Image as ImageIcon, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Trash2,
  X
} from 'lucide-react';

// Configuration for platform-specific rules
const PLATFORM_CONFIG = {
  twitter: {
    id: 'twitter',
    name: 'Twitter / X',
    charLimit: 280,
    icon: Twitter,
    color: 'hover:bg-blue-50 hover:text-blue-500 border-blue-200',
    activeColor: 'bg-blue-50 border-blue-500 text-blue-600',
    progressColor: 'bg-blue-500',
    requiresMedia: false,
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    charLimit: 63206,
    icon: Facebook,
    color: 'hover:bg-blue-50 hover:text-blue-700 border-blue-200',
    activeColor: 'bg-blue-50 border-blue-700 text-blue-800',
    progressColor: 'bg-blue-600',
    requiresMedia: false,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    charLimit: 3000,
    icon: Linkedin,
    color: 'hover:bg-blue-50 hover:text-blue-800 border-blue-200',
    activeColor: 'bg-blue-50 border-blue-800 text-blue-900',
    progressColor: 'bg-blue-700',
    requiresMedia: false,
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    charLimit: 2200,
    icon: Instagram,
    color: 'hover:bg-pink-50 hover:text-pink-600 border-pink-200',
    activeColor: 'bg-pink-50 border-pink-500 text-pink-600',
    progressColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    requiresMedia: true,
  }
};

export default function App() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter']);
  const [media, setMedia] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms((prev) => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  // Real-time validation logic
  const getValidationState = () => {
    const validations = selectedPlatforms.map(platformId => {
      const config = PLATFORM_CONFIG[platformId];
      const charCount = content.length;
      const isOverLimit = charCount > config.charLimit;
      const missingMedia = config.requiresMedia && media.length === 0;
      
      const errors = [];
      if (isOverLimit) {
        errors.push(`Exceeds character limit by ${charCount - config.charLimit} characters.`);
      }
      if (missingMedia) {
        errors.push(`Requires at least one media attachment.`);
      }

      return {
        platform: config,
        charCount,
        isOverLimit,
        missingMedia,
        isValid: !isOverLimit && !missingMedia,
        errors
      };
    });

    const isContentEmpty = content.trim().length === 0 && media.length === 0;
    const hasSelectedPlatforms = selectedPlatforms.length > 0;
    const allValid = validations.every(v => v.isValid) && !isContentEmpty && hasSelectedPlatforms;

    return { validations, allValid, isContentEmpty, hasSelectedPlatforms };
  };

  const { validations, allValid, isContentEmpty, hasSelectedPlatforms } = getValidationState();

  // Mock media upload
  const addMockMedia = () => {
    if (media.length >= 4) return; // Arbitrary max 4 media items limit
    const newMedia = {
      id: Date.now(),
      url: `https://picsum.photos/seed/${Date.now()}/400/300`,
      name: `attachment-${media.length + 1}.jpg`
    };
    setMedia([...media, newMedia]);
  };

  const removeMedia = (id) => {
    setMedia(media.filter(m => m.id !== id));
  };

  const handlePost = () => {
    if (!allValid) return;
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setContent('');
      setMedia([]);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Multi-Platform Post Composer
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Draft your content once and validate constraints across multiple social networks in real-time.
          </p>
        </div>

        {/* Main Composer Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all">
          
          {/* Top Section: Platform Selection */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
              Select Platforms
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.values(PLATFORM_CONFIG).map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-medium ${
                      isSelected 
                        ? platform.activeColor + ' shadow-sm' 
                        : 'bg-white text-slate-500 ' + platform.color
                    }`}
                  >
                    <Icon size={20} />
                    {platform.name}
                    {isSelected && (
                      <CheckCircle2 size={16} className="ml-1 opacity-80" />
                    )}
                  </button>
                );
              })}
            </div>
            {!hasSelectedPlatforms && (
              <p className="text-amber-600 text-sm mt-3 flex items-center gap-1.5">
                <AlertCircle size={14} /> Please select at least one platform to start composing.
              </p>
            )}
          </div>

          {/* Middle Section: Composition Area */}
          <div className="p-6 space-y-4">
            <div className="relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to share with your audience?"
                className="w-full min-h-[160px] p-4 text-lg bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 outline-none transition-all resize-y placeholder:text-slate-400"
                disabled={!hasSelectedPlatforms}
              />
            </div>

            {/* Media Attachments Preview */}
            {media.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {media.map((item) => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm w-32 h-32">
                    <img src={item.url} alt="attachment" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeMedia(item.id)}
                      className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Media & Action Toolbar */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={addMockMedia}
                disabled={!hasSelectedPlatforms || media.length >= 4}
                className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-600"
              >
                <ImageIcon size={20} />
                <span>Add Media</span>
                <span className="text-xs text-slate-400 ml-1">({media.length}/4)</span>
              </button>
            </div>
          </div>

          {/* Bottom Section: Validation & Submission */}
          {hasSelectedPlatforms && (
            <div className="bg-slate-50 border-t border-slate-100 p-6 space-y-6">
              
              {/* Constraints Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validations.map((v) => {
                  const percent = Math.min((v.charCount / v.platform.charLimit) * 100, 100);
                  const isNearingLimit = percent > 85 && !v.isOverLimit;
                  
                  return (
                    <div key={v.platform.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 font-medium text-slate-700">
                          <v.platform.icon size={16} className={v.platform.activeColor.split(' ')[2]} />
                          {v.platform.name}
                        </div>
                        <div className={`text-sm font-bold ${
                          v.isOverLimit ? 'text-red-500' : isNearingLimit ? 'text-amber-500' : 'text-slate-500'
                        }`}>
                          {v.charCount} / {v.platform.charLimit.toLocaleString()}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            v.isOverLimit ? 'bg-red-500' : isNearingLimit ? 'bg-amber-400' : v.platform.progressColor
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Error Messages */}
                      {v.errors.length > 0 ? (
                        <div className="space-y-1 mt-2">
                          {v.errors.map((err, idx) => (
                            <p key={idx} className="text-xs text-red-600 flex items-start gap-1">
                              <AlertCircle size={12} className="mt-0.5 shrink-0" />
                              {err}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2">
                          <CheckCircle2 size={12} /> Ready to post
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Area */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-sm text-slate-500">
                  {isContentEmpty ? (
                    'Add text or media to continue.'
                  ) : !allValid ? (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertCircle size={14} /> Resolve errors to post.
                    </span>
                  ) : null}
                </div>
                
                <button
                  onClick={handlePost}
                  disabled={!allValid || isSubmitting || isContentEmpty}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg transition-all ${
                    allValid && !isContentEmpty
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30 hover:-translate-y-0.5' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isSubmitting ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
            <CheckCircle2 size={24} />
            <div>
              <p className="font-bold">Post Published!</p>
              <p className="text-emerald-100 text-sm">Successfully sent to selected platforms.</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="ml-4 hover:bg-emerald-700 p-1 rounded-md transition-colors">
              <X size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}