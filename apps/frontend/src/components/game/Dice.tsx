import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceProps {
  value?: number;
  isRolling?: boolean;
  onRoll?: () => void;
  disabled?: boolean;
  used?: boolean;
}

const DiceIcon: React.FC<{ value: number; className?: string }> = ({ value, className = "" }) => {
  const diceEmojis = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
  };

  return (
    <span className={`text-2xl ${className}`}>
      {diceEmojis[value as keyof typeof diceEmojis] || '?'}
    </span>
  );
};

export const Dice: React.FC<DiceProps> = ({ 
  value, 
  isRolling = false, 
  onRoll, 
  disabled = false,
  used = false 
}) => {
  const [displayValue, setDisplayValue] = useState(value || 1);

  const handleRoll = useCallback(() => {
    if (disabled || isRolling) return;
    onRoll?.();
  }, [disabled, isRolling, onRoll]);

  React.useEffect(() => {
    if (isRolling) {
      // Animate rolling effect
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 100);
      
      return () => clearInterval(interval);
    } else if (value) {
      setDisplayValue(value);
    }
  }, [isRolling, value]);

  const getDiceClasses = () => {
    let classes = 'dice cursor-pointer transition-all duration-200 hover:shadow-lg';
    if (isRolling) classes += ' rolling';
    if (disabled) classes += ' opacity-50 cursor-not-allowed';
    if (used) classes += ' opacity-60 bg-gray-100';
    return classes;
  };

  return (
    <motion.div
      className={getDiceClasses()}
      onClick={handleRoll}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={displayValue}
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DiceIcon value={displayValue} className="w-8 h-8" />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

interface DicePairProps {
  values?: [number, number];
  isRolling?: boolean;
  onRoll?: () => void;
  disabled?: boolean;
  usedDice?: [boolean, boolean];
  canRoll?: boolean;
}

export const DicePair: React.FC<DicePairProps> = ({
  values,
  isRolling = false,
  onRoll,
  disabled = false,
  usedDice = [false, false],
  canRoll = true
}) => {
  return (
    <div className="dice-container">
      <div className="flex gap-4 items-center">
        <Dice
          value={values?.[0]}
          isRolling={isRolling}
          disabled={disabled || !canRoll}
          used={usedDice[0]}
        />
        <Dice
          value={values?.[1]}
          isRolling={isRolling}
          disabled={disabled || !canRoll}
          used={usedDice[1]}
        />
      </div>
      
      {canRoll && !values && (
        <motion.button
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={onRoll}
          disabled={disabled || isRolling}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isRolling ? 'Rolling...' : 'Roll Dice'}
        </motion.button>
      )}
      
      {values && (
        <div className="mt-2 text-center">
          <span className="text-sm text-gray-600">
            Total: {values[0] + values[1]}
          </span>
        </div>
      )}
    </div>
  );
};
