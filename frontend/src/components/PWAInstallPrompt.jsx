import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from './ui/Button';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      backgroundColor: 'var(--color-glass-bg)',
      padding: '12px 20px',
      borderRadius: '16px',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      border: '1px solid var(--color-glass-border)',
      maxWidth: '90%',
      width: 'max-content',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div style={{
        background: 'var(--gradient-primary)',
        padding: '8px',
        borderRadius: '10px',
        color: 'var(--color-primary)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
      }}>
        <Download size={20} />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text)' }}>Instalar App</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Añadir a pantalla de inicio</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
        <Button 
          size="sm" 
          onClick={handleInstallClick}
          style={{ height: '36px', fontSize: '0.85rem' }}
        >
          Instalar
        </Button>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
