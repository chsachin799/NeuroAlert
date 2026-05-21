import { useEffect } from 'react';

const KeyboardShortcuts = ({
  onToggleSettings,
  onToggleProfile,
  onStartCalibration,
  onStartReactionTest,
  onFetchReport,
  onResetSession,
  onToggleMute,
}) => {
  useEffect(() => {
    const handler = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const key = e.key.toLowerCase();
      
      if (key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onToggleSettings?.();
      } else if (key === 'p') {
        e.preventDefault();
        onToggleProfile?.();
      } else if (key === 'c') {
        e.preventDefault();
        onStartCalibration?.();
      } else if (key === 't') {
        e.preventDefault();
        onStartReactionTest?.();
      } else if (key === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onFetchReport?.();
      } else if (key === 'x') {
        e.preventDefault();
        onResetSession?.();
      } else if (key === 'm') {
        e.preventDefault();
        onToggleMute?.();
      } else if (key === 'escape') {
        onToggleSettings?.();
        onToggleProfile?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onToggleSettings, onToggleProfile, onStartCalibration, onStartReactionTest, onFetchReport, onResetSession, onToggleMute]);

  return null;
};

export default KeyboardShortcuts;
