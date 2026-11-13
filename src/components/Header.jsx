import { MessageCircle } from 'lucide-react';

import { getWhatsAppUrl } from '../config/store.js';
import styles from './Header.module.css';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <a className={styles.brand} href="#inicio" aria-label="Maison Lia, inicio">
                    <span className={styles.brandName}>Maison Lia</span>
                    <span className={styles.brandLabel}>Delivery</span>
                </a>

                <nav className={styles.nav} aria-label="Navegación principal">
                    <a href="#catalogo">Catálogo</a>
                    <a href="#horarios">Horarios</a>
                </nav>

                <a
                    className={styles.contactLink}
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <MessageCircle size={18} aria-hidden="true" />
                    <span>WhatsApp</span>
                </a>
            </div>
        </header>
    );
}
