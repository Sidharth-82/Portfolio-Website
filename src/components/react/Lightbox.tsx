import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface LightboxProps {
  /** image source to show fullscreen; `null` keeps the lightbox closed */
  src: string | null;
  alt?: string;
  onClose: () => void;
}

/**
 * Fullscreen image viewer. Closes on Escape, a click anywhere, or the ✕ button.
 *
 * The Escape handler runs in the capture phase and stops propagation so that,
 * when the lightbox is layered over another modal (e.g. a project popup), Escape
 * closes the image first instead of also closing the modal underneath.
 */
export default function Lightbox({ src, alt, onClose }: LightboxProps) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [src, onClose]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={alt ? `${alt} (fullscreen)` : 'Image (fullscreen)'}
        >
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
          <button
            onClick={onClose}
            aria-label="Close image"
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white/80 transition hover:border-white hover:text-white"
          >
            ✕
          </button>
          <motion.img
            src={src}
            alt={alt}
            className="relative z-10 max-h-full max-w-full cursor-zoom-out rounded-lg object-contain shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
