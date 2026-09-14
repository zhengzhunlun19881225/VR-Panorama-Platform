import React, { useState, useEffect } from 'react';
import { Hotspot } from '../../types';
import { 
  X, 
  ExternalLink, 
  Phone, 
  Send, 
  CheckCircle2, 
  Volume2, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  HelpCircle 
} from 'lucide-react';

interface HotspotModalProps {
  hotspot: Hotspot | null;
  onClose: () => void;
}

export const HotspotModal: React.FC<HotspotModalProps> = ({ hotspot, onClose }) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
    setFormSubmitted(false);
  }, [hotspot?.id]);

  if (!hotspot || hotspot.type === 'scene_jump') return null;

  const content = hotspot.content || { title: hotspot.title };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div 
      id="hotspot-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="hotspot-modal-card"
        className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl text-slate-900 dark:text-zinc-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: hotspot.style.color || '#0ea5e9' }}
            >
              {hotspot.type === 'info_richtext' && <FileText className="w-4 h-4" />}
              {hotspot.type === 'info_image' && <ImageIcon className="w-4 h-4" />}
              {hotspot.type === 'info_video' && <Video className="w-4 h-4" />}
              {hotspot.type === 'info_audio' && <Volume2 className="w-4 h-4" />}
              {hotspot.type === 'info_link' && <ExternalLink className="w-4 h-4" />}
              {hotspot.type === 'info_phone' && <Phone className="w-4 h-4" />}
              {hotspot.type === 'info_form' && <Send className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="font-semibold text-base leading-tight text-slate-900 dark:text-white">{content.title || hotspot.title}</h3>
              {content.description && (
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{content.description}</p>
              )}
            </div>
          </div>
          <button
            id="btn-close-hotspot-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-white rounded-lg dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Rich text with optional images */}
          {hotspot.type === 'info_richtext' && (
            <div className="space-y-4">
              {content.images && content.images.length > 0 && (
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden bg-black/40 aspect-video flex items-center justify-center border border-zinc-800">
                    <img 
                      src={content.images[activeImageIndex]} 
                      alt="Hotspot gallery" 
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {content.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {content.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                            activeImageIndex === idx ? 'border-sky-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="prose prose-invert prose-sm text-zinc-300 leading-relaxed space-y-3">
                <p>{content.richText || '这里是图文热点的详细介绍内容。用户可以在全景编辑器右侧属性面板中自由编辑文案与段落。'}</p>
              </div>
            </div>
          )}

          {/* Image gallery */}
          {hotspot.type === 'info_image' && content.images && content.images.length > 0 && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden bg-black/40 aspect-video flex items-center justify-center border border-zinc-800">
                <img 
                  src={content.images[activeImageIndex]} 
                  alt="Hotspot gallery" 
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              {content.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {content.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        activeImageIndex === idx ? 'border-sky-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Video Player */}
          {hotspot.type === 'info_video' && content.videoUrl && (
            <div className="rounded-xl overflow-hidden bg-black aspect-video border border-zinc-800">
              <video 
                src={content.videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Audio Player */}
          {hotspot.type === 'info_audio' && (
            <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700/60 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <p className="font-medium text-sm text-zinc-200">{content.audioName || '语音解说音频'}</p>
                  <p className="text-xs text-zinc-400">点击播放收听专业讲解录音</p>
                </div>
              </div>
              <audio 
                src={content.audioUrl || 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=welcome-gentle-narration.mp3'} 
                controls 
                className="w-full h-9"
              />
            </div>
          )}

          {/* External Link */}
          {hotspot.type === 'info_link' && (
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 space-y-3 text-center">
              <p className="text-sm text-zinc-300">点击下方按钮将在新标签页中打开链接</p>
              <a 
                href={content.linkUrl || 'https://ai.google.dev'} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors shadow-lg shadow-sky-600/20 w-full"
              >
                <span>{content.linkTitle || '访问目标链接'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Phone Dial */}
          {hotspot.type === 'info_phone' && (
            <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Phone className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider">联系电话</p>
                <p className="text-2xl font-bold text-white tracking-wide mt-1">{content.phone || '400-880-9966'}</p>
              </div>
              <a 
                href={`tel:${content.phone || '400-880-9966'}`} 
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/20 w-full"
              >
                <Phone className="w-4 h-4" />
                <span>立即拨打专线</span>
              </a>
            </div>
          )}

          {/* Form */}
          {hotspot.type === 'info_form' && (
            <div>
              {formSubmitted ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-6 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-semibold text-emerald-200">提交成功！</h4>
                  <p className="text-xs text-emerald-300/80">我们已收到您的预约信息，客服专员将尽快与您联系。</p>
                  <button
                    type="button"
                    onClick={() => setFormSubmitted(false)}
                    className="mt-3 text-xs text-zinc-400 hover:text-white underline"
                  >
                    重新提交
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  {(content.formFields || [
                    { id: '1', label: '您的姓名', type: 'text', placeholder: '请输入姓名', required: true },
                    { id: '2', label: '手机号码', type: 'tel', placeholder: '请输入手机号', required: true },
                    { id: '3', label: '参访日期', type: 'date', required: true },
                    { id: '4', label: '备注需求', type: 'textarea', placeholder: '如有特殊需求请填写', required: false }
                  ]).map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-xs font-medium text-zinc-300">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.placeholder}
                          required={field.required}
                          rows={2}
                          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      )}
                    </div>
                  ))}
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 mt-4"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>确认提交</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
