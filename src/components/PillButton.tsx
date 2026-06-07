import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import styles from './PillButton.module.css'

interface PillButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline'
  icon?: ReactNode
  type?: 'button' | 'submit'
  disabled?: boolean
}

export default function PillButton({
  children,
  onClick,
  variant = 'primary',
  icon,
  type = 'button',
  disabled,
}: PillButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.pill} ${styles[variant]}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </motion.button>
  )
}
