import React, { useState } from 'react';
import { VRProject } from '../../types';
import { X, Copy, Check, QrCode, Globe, Code, KeyRound, ExternalLink } from 'lucide-react';

interface ShareModalProps {
  project: VRProject;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ project, isOpen, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'qrcode' | 'embed'>('link');

  if (!isOpen) return null;

  const origin = window.location.origin;
  const shareUrl = `${origin}/#preview-${project.id}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0" allowfullscreen allow="gyroscope; accelerometer"></iframe>`;

  const handleCopy = (text: string, type: 'link' | 'iframe') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    }
  };

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="share-modal-card"
        className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-sm text-white">获取全景分享链接与嵌入代码</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'link' ? 'bg-zinc-800 text-sky-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            分享链接
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qrcode')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'qrcode' ? 'bg-zinc-800 text-sky-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            全景二维码
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('embed')}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'embed' ? 'bg-zinc-800 text-sky-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            网页嵌入代码
          </button>
        </div>

        {/* Tab 1: Share Link */}
        {activeTab === 'link' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">公开分享 URL</span>
              {project.accessPermission === 'password' && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" />
                  访问需输入密码: {project.accessPassword || '默认'}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-300 select-all font-mono"
              />
              <button
                type="button"
                onClick={() => handleCopy(shareUrl, 'link')}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium shrink-0 flex items-center gap-1.5 transition-colors shadow-md shadow-sky-600/20"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? '已复制' : '复制'}</span>
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              任何人通过该链接均可在手机、平板、电脑或 VR 头显中畅享沉浸式 360° 漫游。
            </p>
          </div>
        )}

        {/* Tab 2: QR Code */}
        {activeTab === 'qrcode' && (
          <div className="flex flex-col items-center py-3 space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-xl">
              {/* Clean SVG Vector QR Code representation */}
              <div className="w-44 h-44 bg-white flex flex-col items-center justify-center p-2 border border-zinc-200 rounded-xl relative">
                <div className="w-full h-full border-4 border-zinc-900 p-2 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-zinc-900 border-2 border-white" />
                    <div className="w-8 h-8 bg-zinc-900 border-2 border-white" />
                  </div>
                  <div className="w-10 h-10 border-2 border-zinc-900 mx-auto flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-zinc-900" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-zinc-900 border-2 border-white" />
                    <div className="text-[9px] font-bold text-zinc-900 self-end">VR 360°</div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-zinc-400 text-center">
              使用微信或手机浏览器扫一扫，立即体验移动端全景漫游
            </p>
          </div>
        )}

        {/* Tab 3: Embed Code */}
        {activeTab === 'embed' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>HTML IFrame 嵌入代码</span>
              <button
                type="button"
                onClick={() => handleCopy(embedCode, 'iframe')}
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                {copiedIframe ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIframe ? '已复制' : '复制代码'}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={4}
              value={embedCode}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-[11px] text-zinc-300 font-mono select-all"
            />

            <p className="text-[11px] text-zinc-500">
              复制上方代码，直接粘贴至您的官网、微信公众号文章网页或第三方系统中即可内嵌展示。
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
