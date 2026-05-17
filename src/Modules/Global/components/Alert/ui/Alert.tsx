import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiXCircle } from "react-icons/fi";
import { alertConfig, type AlertProps } from '../../../types/Alert';



export const Alert: React.FC<AlertProps> = ({ 
  type, 
  title, 
  description, 
  onClose, 
  className = '',
  actionButton,
  duration = 4000,
  showProgress = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!showProgress || !duration) return;

    const startTime = Date.now();
    let animationFrameId: number;
    // Reducir la duración para que la barra llegue al final antes que el timeout del hook
    const barDuration = duration;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / barDuration) * 100);
      
      setProgress(remaining);
      
      // Cerrar cuando la barra llegue al final
      if (remaining <= 0) {
        handleClose();
      } else {
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [duration, showProgress]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const config = alertConfig[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ x: 400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 400, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            mass: 0.8
          }}
          className={`
            ${config.bgColor} 
            ${config.borderColor} 
            border-l-4 rounded-r-lg shadow-lg backdrop-blur-sm overflow-hidden
            ${className}
          `}
        >
          <div className="p-4">
            <div className="flex items-start">
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex-1"
              >
                <h3 className={`text-sm font-semibold ${config.titleColor} mb-0.5`}>
                  {title}
                </h3>
                {description && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={`mt-1 text-sm ${config.textColor} leading-relaxed`}
                  >
                    {description}
                  </motion.p>
                )}
                {actionButton && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mt-3 flex gap-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={actionButton.onClick}
                      className={`px-3 py-1 text-xs font-medium rounded-md ${config.titleColor} border border-current hover:bg-white/10 transition-colors`}
                    >
                      {actionButton.text}
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
              
              {onClose && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className={`ml-3 ${config.textColor} hover:${config.titleColor} transition-colors p-1 hover:bg-white/50 rounded flex-shrink-0`}
                  aria-label="Cerrar alerta"
                >
                  <FiXCircle className="h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Barra de Progreso Animada */}
          {showProgress && onClose && (
            <div className="h-1 bg-gray-200/30 relative overflow-hidden">
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
                className={`h-full ${config.progressColor} relative`}
              >
                {/* Efecto de brillo animado */}
                <motion.div 
                  animate={{ 
                    x: ['-100%', '100%'] 
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};