import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeftIcon } from './icons'
import styles from './BackButton.module.css'

export default function BackButton() {
  const navigate = useNavigate()
  return (
    <motion.button
      className={styles.back}
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      whileHover={{ x: -3 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Go back"
    >
      <ArrowLeftIcon />
    </motion.button>
  )
}
