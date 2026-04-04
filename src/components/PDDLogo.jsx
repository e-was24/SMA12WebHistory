import { motion } from 'framer-motion'

export function PDDLogo() {
  return (
    <div style={{ position: 'relative', width: '200px', height: '200px' }}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shutter Ring */}
        <motion.circle 
          cx="50" cy="50" r="45" 
          stroke="var(--accent)" 
          strokeWidth="2" 
          strokeDasharray="280"
          initial={{ strokeDashoffset: 280 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        
        {/* Camera Body Concept */}
        <motion.rect 
          x="30" y="40" width="40" height="25" rx="2" 
          stroke="#fff" 
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        />
        
        {/* Lens */}
        <motion.circle 
          cx="50" cy="52.5" r="8" 
          stroke="#fff" 
          strokeWidth="1.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 100 }}
        />

        {/* Shutter Blades (Live Animation) */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.line 
            key={i}
            x1="50" y1="20" x2="50" y2="35"
            stroke="var(--accent)"
            strokeWidth="1"
            transform={`rotate(${angle} 50 50)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 1.5 + (i * 0.1) }}
          />
        ))}

        {/* Sparkle/Flash */}
        <motion.path 
          d="M75 30 L80 35 M75 35 L80 30" 
          stroke="var(--accent)" 
          strokeWidth="2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
          transition={{ delay: 2, duration: 1, repeat: Infinity, repeatDelay: 2 }}
        />
      </svg>
      
      {/* PDD Text in SVG container center-bottom */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        style={{
          position: 'absolute',
          bottom: '15px',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: "'Outfit', sans-serif",
          fontWeight: '900',
          letterSpacing: '0.4rem',
          fontSize: '1.2rem',
          color: '#fff'
        }}
      >
        PDD
      </motion.div>
    </div>
  )
}
