import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

type RulebookModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const STORAGE_URL = 'https://wdcwyvfeegchjadtyhkh.supabase.co/storage/v1/object/public/public-documents/Ascend%20Leagues%20Rulebook.md';

export default function RulebookModal({ isOpen, onClose }: RulebookModalProps) {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchMarkdown() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(STORAGE_URL);
        if (!response.ok) {
          throw new Error('Failed to load rulebook content');
        }
        const text = await response.text();
        setMarkdownContent(text);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        setError(message);
        console.error('Failed to fetch rulebook:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchMarkdown();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '900px',
          height: '90vh',
          backgroundColor: '#12141A',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #373A41',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid #373A41',
            backgroundColor: '#0C0E12',
          }}
        >
          <h2
            style={{
              margin: 0,
              color: '#F7F7F7',
              fontSize: '20px',
              fontWeight: 600,
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            }}
          >
            Ascend Leagues Rulebook
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#CECFD2',
              fontSize: '28px',
              cursor: 'pointer',
              padding: '0 8px',
              lineHeight: 1,
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#F7F7F7')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#CECFD2')}
            aria-label="Close rulebook"
          >
            ×
          </button>
        </div>

        {/* Content area with markdown */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '32px',
          }}
          className="modal-markdown-content"
        >
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 16 }}>
              <AiOutlineLoading3Quarters size={48} color="#7F56D9" style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              <div style={{ color: '#94979C', fontSize: 16, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>Loading rulebook...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ color: '#EF4444', fontSize: 18, fontFamily: '"IBM Plex Sans", system-ui, sans-serif', marginBottom: 12 }}>Failed to load rulebook</div>
              <div style={{ color: '#94979C', fontSize: 14, fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>{error}</div>
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdownContent}
            </ReactMarkdown>
          )}
        </div>

        <style>{`
          .modal-markdown-content {
            color: #CECFD2;
            font-family: "IBM Plex Sans", system-ui, sans-serif;
            line-height: 1.6;
          }

          .modal-markdown-content h1 {
            color: #F7F7F7;
            font-size: 32px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 20px;
            letter-spacing: -0.5px;
          }

          .modal-markdown-content h2 {
            color: #F7F7F7;
            font-size: 22px;
            font-weight: 600;
            margin-top: 28px;
            margin-bottom: 14px;
          }

          .modal-markdown-content h3 {
            color: #F7F7F7;
            font-size: 18px;
            font-weight: 600;
            margin-top: 20px;
            margin-bottom: 10px;
          }

          .modal-markdown-content p {
            margin-bottom: 14px;
          }

          .modal-markdown-content ol,
          .modal-markdown-content ul {
            margin-bottom: 14px;
            padding-left: 20px;
          }

          .modal-markdown-content li {
            margin-bottom: 6px;
          }

          .modal-markdown-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background-color: #0C0E12;
            border-radius: 8px;
            overflow: hidden;
          }

          .modal-markdown-content th {
            background-color: #1a1c24;
            color: #F7F7F7;
            font-weight: 600;
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #373A41;
            font-size: 14px;
          }

          .modal-markdown-content td {
            padding: 10px;
            border-bottom: 1px solid #2a2c34;
            color: #CECFD2;
            font-size: 14px;
          }

          .modal-markdown-content tr:last-child td {
            border-bottom: none;
          }

          .modal-markdown-content tr:hover {
            background-color: rgba(127, 86, 217, 0.05);
          }

          .modal-markdown-content hr {
            border: none;
            border-top: 1px solid #373A41;
            margin: 24px 0;
          }

          .modal-markdown-content strong {
            color: #F7F7F7;
            font-weight: 600;
          }

          .modal-markdown-content code {
            background-color: #1a1c24;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 13px;
          }

          .modal-markdown-content a {
            color: #A78BFA;
            text-decoration: underline;
          }

          .modal-markdown-content a:hover {
            color: #C4B5FD;
          }
        `}</style>
      </div>
    </div>
  );
}

