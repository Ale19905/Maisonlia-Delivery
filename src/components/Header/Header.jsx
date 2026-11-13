import { MessageCircle } from 'lucide-react';

import { createWhatsAppLink } from '../../utils/whatsapp';
import styles from './Header.module.css';

const contactLink = createWhatsAppLink(
    'Hola, Maison Lia. Quisiera consultar sobre los pedidos a domicilio.'
);

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <a className={styles.brand} href="#inicio" aria-label="Maison Lia, inicio">
                    <span className={styles.brandName}>MAISON LIA</span>
                    <span className={styles.brandSubtitle}>GASTRONOMIE & CAFÉ</span>
                </a>

                <nav className={styles.navigation} aria-label="Navegación principal">
                    <a href="#catalogo">Catálogo</a>
                    <a href="#horarios">Horarios</a>
                </nav>

                <a
                    className={styles.contactButton}
                    href={contactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Consultar con Maison Lia por WhatsApp"
                >
                    <MessageCircle size={18} aria-hidden="true" />
                    <span>WhatsApp</span>
                </a>
            </div>
        </header>
    );
}
