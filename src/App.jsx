import { ArrowRight, Clock3, MessageCircle } from 'lucide-react';

import Header from './components/Header.jsx';
import Catalog from './components/Catalog.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { useCatalog } from './hooks/useCatalog.js';
import { getWhatsAppUrl, store } from './config/store.js';

import styles from './App.module.css';

function Storefront({ catalog }) {
    const whatsappUrl = getWhatsAppUrl();

    return (
        <div className={styles.app}>
            <Header />

            <main>
                <section className={styles.hero} id="inicio">
                    <div className={styles.heroInner}>
                        <div className={styles.heroContent}>
                            <p className={styles.eyebrow}>
                                Gastronomía a domicilio
                            </p>

                            <h1>Tu momento, nuestra pasión.</h1>

                            <p className={styles.heroDescription}>
                                Explorá nuestro menú, agregá tus favoritos al
                                carrito y prepará tu pedido para enviarlo por
                                WhatsApp. Coordinaremos los detalles de entrega
                                directamente contigo.
                            </p>

                            <div className={styles.heroActions}>
                                <a
                                    className={styles.primaryButton}
                                    href="#catalogo"
                                >
                                    Explorar catálogo
                                    <ArrowRight size={19} aria-hidden="true" />
                                </a>

                                <a
                                    className={styles.secondaryButton}
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Consultar por WhatsApp
                                </a>
                            </div>
                        </div>

                        <div className={styles.heroBrand}>
                            <img
                                className={styles.logo}
                                src="/brand/maison-lia-logo.webp"
                                alt="Maison Lia, Gastronomie & Café"
                                width="1009"
                                height="1080"
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.section} id="catalogo">
                    <div className={styles.sectionIntro}>
                        <p className={styles.sectionLabel}>Nuestro menú</p>
                        <h2>Descubrí Maison Lia</h2>
                        <p>
                            Explorá los productos, elegí cantidades y
                            revisá el pedido en tu carrito.
                        </p>
                    </div>

                    <Catalog
                        categories={catalog.categories}
                        products={catalog.products}
                        isLoading={catalog.isLoading}
                        error={catalog.error}
                        onRetry={catalog.retry}
                    />
                </section>

                <section className={styles.infoSection} id="horarios">
                    <div className={styles.infoInner}>
                        <div className={styles.infoText}>
                            <p className={styles.sectionLabel}>
                                Atención al cliente
                            </p>
                            <h2>Horarios y pedidos</h2>
                            <p>
                                Podés consultar la disponibilidad y coordinar la
                                entrega directamente con nosotros por WhatsApp.
                            </p>
                        </div>

                        <div className={styles.hoursCard}>
                            <div className={styles.cardTitle}>
                                <Clock3 size={20} aria-hidden="true" />
                                <h3>Horario de atención</h3>
                            </div>

                            {store.openingHours.map(({ days, hours }) => (
                                <div className={styles.hoursRow} key={days}>
                                    <span>{days}</span>
                                    <strong>{hours}</strong>
                                </div>
                            ))}

                            <a
                                className={styles.whatsappButton}
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageCircle size={19} aria-hidden="true" />
                                Escribir por WhatsApp
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className={styles.footer}>
                <span>{store.name} · {store.subtitle}</span>
                <span>Hecho para disfrutar cada momento.</span>
            </footer>

            <CartDrawer
                isCatalogLoading={catalog.isLoading}
                onRefreshCatalog={catalog.refreshCatalog}
            />
        </div>
    );
}

export default function App() {
    const catalog = useCatalog();

    return (
        <CartProvider products={catalog.products}>
            <Storefront catalog={catalog} />
        </CartProvider>
    );
}
