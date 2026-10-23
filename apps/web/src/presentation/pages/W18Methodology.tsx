import { useState, type ReactNode } from 'react';
import {
  Button,
  Disclosure,
  Text,
  TopBar,
  UtilityScreen,
  type BubbleTone,
  type IconName,
} from '@/presentation/components';
import { useMediaQuery } from '@/presentation/hooks/useMediaQuery';
import { useNavigation } from '@/presentation/providers/Navigation';
import layout from './shared/Layout.module.css';
import styles from './W18Methodology.module.css';

interface Section {
  id: string;
  title: string;
  icon: IconName;
  tone: BubbleTone;
  body: ReactNode;
}

const SECTIONS: readonly Section[] = [
  {
    id: 'fuente',
    title: 'Fuente',
    icon: 'info',
    tone: 'brand',
    body: 'Conteos censales de participación del INE (DECEYEC), elecciones federales 2009–2024. Versión de datos [AAAAMMDD-hash].',
  },
  {
    id: 'formula',
    title: 'Fórmula de participación',
    icon: 'chart',
    tone: 'brand-strong',
    body: (
      <>
        <p className={styles.formula}>
          Participación = <b>Votaron</b> ÷ (Lista nominal − Sin dato)
        </p>
        <p>Los registros sin dato no cuentan como abstención: se quitan del denominador.</p>
      </>
    ),
  },
  {
    id: 'exclusiones',
    title: 'Qué se excluye',
    icon: 'minus',
    tone: 'violet',
    body: 'Registros sin dato de participación, sexo fuera de catálogo y edades fuera de 18–110 años. El reporte de calidad dice cuántos fueron.',
  },
  {
    id: 'umbral',
    title: 'Umbral de publicación',
    icon: 'users',
    tone: 'indigo',
    body: 'Un municipio con lista nominal menor a [umbral] no se publica: se muestra su entidad con una nota, para no identificar a grupos pequeños.',
  },
  {
    id: 'grupos',
    title: 'Grupos de edad y tipo de elección',
    icon: 'calendar',
    tone: 'neutral',
    body: 'Cinco grupos: 18–24, 25–34, 35–44, 45–59 y 60 +. Intermedias y presidenciales siempre se distinguen.',
  },
  {
    id: 'arquetipos',
    title: 'Arquetipos municipales',
    icon: 'star',
    tone: 'brand',
    body: 'K-means con k = 5 sobre nivel, efecto presidencial, tendencia y volatilidad frente al país. Validado por bootstrap (ARI [—.—]).',
  },
  {
    id: 'validacion',
    title: 'Validación',
    icon: 'check',
    tone: 'mint',
    body: 'Cada cifra se compara con la publicada por el INE. Si alguna difiere más de 1 punto, no se publica.',
  },
];

/**
 * W-18 · Methodology (US-22, RF-23). Accordion on mobile and tablet; on desktop every section is
 * open with a table of contents on the left.
 */
export function W18Methodology() {
  const nav = useNavigation();
  const desktop = useMediaQuery('(min-width: 1200px)');
  const [open, setOpen] = useState<string | null>('formula');
  const sections = (
    <div className={[layout.stack, styles.sections].join(' ')}>
      {SECTIONS.map((s) => (
        <Disclosure
          key={s.id}
          id={`metodologia-${s.id}`}
          title={s.title}
          icon={s.icon}
          tone={s.tone}
          open={desktop || open === s.id}
          onToggle={desktop ? undefined : () => setOpen(open === s.id ? null : s.id)}
        >
          {typeof s.body === 'string' ? <p>{s.body}</p> : s.body}
        </Disclosure>
      ))}
    </div>
  );
  const actions = (
    <div className={layout.stack}>
      <Button variant="primary" icon="download" fullWidth disabled>
        Descargar metodología (PDF)
      </Button>
      <Button icon="check" fullWidth onClick={() => nav.openSheet('W-20')}>
        Reporte de calidad
      </Button>
      <Text variant="meta">El PDF se publica con el dataset final.</Text>
    </div>
  );
  return (
    <UtilityScreen
      top={
        <TopBar
          onBack={() => nav.goTo('W-16')}
          backLabel="Datos abiertos"
          onSettings={() => nav.openSheet('W-13')}
        />
      }
      title="Metodología"
      lead="Cómo calculamos cada cifra de ReVoto. Corte [dd/mm/aaaa]."
      aside={desktop ? sections : undefined}
      columns="sidebar"
    >
      {desktop ? (
        <nav aria-label="Secciones de la metodología" className={styles.toc}>
          <ol>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#metodologia-${s.id}`}
                  onClick={(e) => {
                    // The hash belongs to the screen router: scroll without changing it.
                    e.preventDefault();
                    document
                      .getElementById(`metodologia-${s.id}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  {s.title.split(' · ')[0]}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : (
        sections
      )}
      {actions}
    </UtilityScreen>
  );
}
