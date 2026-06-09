import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export const BackButton = ({ onClick, label = "Go Back" }: BackButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-ucl-neon transition-colors font-bold uppercase tracking-widest text-xs z-30"
  >
    <ArrowLeft size={16} />
    {label}
  </motion.button>
);
