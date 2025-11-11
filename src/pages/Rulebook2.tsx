import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import BrandHeader from '../components/BrandHeader';
import useResponsiveLayout from '../hooks/useResponsiveLayout';

const STORAGE_URL = 'https://wdcwyvfeegchjadtyhkh.supabase.co/storage/v1/object/public/public-documents/ASCEND%20BREAKPOINT%20SERIES%202a8a5f3a43708161872ee88a6d56b1a5.md';

export default function Rulebook2() {
  const { isTablet, headerMaxWidth } = useResponsiveLayout();
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarkdown() {
      try {
        setLoading(true);
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
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0C0E12', position: 'relative', overflow: 'hidden' }}>
      <BrandHeader isTablet={isTablet} headerMaxWidth={headerMaxWidth} />

      <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', padding: isTablet ? '40px 80px' : '24px', width: '100%', boxSizing: 'border-box' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            backgroundColor: 'rgba(18, 20, 26, 0.8)',
            borderRadius: '12px',
            border: '1px solid #373A41',
            padding: isTablet ? '48px' : '24px',
            boxSizing: 'border-box',
          }}
          className="markdown-content"
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
      </main>

      <style>{`
        .markdown-content {
          color: #CECFD2;
          font-family: "IBM Plex Sans", system-ui, sans-serif;
          line-height: 1.6;
        }

        .markdown-content h1 {
          color: #F7F7F7;
          font-size: 36px;
          font-weight: 700;
          margin-top: 0;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }

        .markdown-content h2 {
          color: #F7F7F7;
          font-size: 24px;
          font-weight: 600;
          margin-top: 32px;
          margin-bottom: 16px;
        }

        .markdown-content h3 {
          color: #F7F7F7;
          font-size: 20px;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 12px;
        }

        .markdown-content p {
          margin-bottom: 16px;
        }

        .markdown-content ol,
        .markdown-content ul {
          margin-bottom: 16px;
          padding-left: 24px;
        }

        .markdown-content li {
          margin-bottom: 8px;
        }

        .markdown-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          background-color: #0C0E12;
          border-radius: 8px;
          overflow: hidden;
        }

        .markdown-content th {
          background-color: #1a1c24;
          color: #F7F7F7;
          font-weight: 600;
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #373A41;
        }

        .markdown-content td {
          padding: 12px;
          border-bottom: 1px solid #2a2c34;
          color: #CECFD2;
        }

        .markdown-content tr:last-child td {
          border-bottom: none;
        }

        .markdown-content tr:hover {
          background-color: rgba(127, 86, 217, 0.05);
        }

        .markdown-content hr {
          border: none;
          border-top: 1px solid #373A41;
          margin: 32px 0;
        }

        .markdown-content strong {
          color: #F7F7F7;
          font-weight: 600;
        }

        .markdown-content code {
          background-color: #1a1c24;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
        }

        .markdown-content a {
          color: #A78BFA;
          text-decoration: underline;
        }

        .markdown-content a:hover {
          color: #C4B5FD;
        }

        @media (max-width: 768px) {
          .markdown-content h1 {
            font-size: 28px;
          }

          .markdown-content h2 {
            font-size: 20px;
          }

          .markdown-content table {
            font-size: 14px;
          }

          .markdown-content th,
          .markdown-content td {
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
}
