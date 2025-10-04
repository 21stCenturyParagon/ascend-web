// import React from 'react';

type RulebookModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function RulebookModal({ isOpen, onClose }: RulebookModalProps) {
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
          maxWidth: '1200px',
          height: '90vh',
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
            aria-label="Close rulebook"
          >
            ×
          </button>
        </div>

        {/* PDF viewer iframe */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <iframe
            src="/ascend-leagues-rulebook.pdf#toolbar=0&navpanes=0&scrollbar=1"
            title="Ascend Leagues Rulebook"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}

