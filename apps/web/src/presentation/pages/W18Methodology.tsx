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
import { DATA_COPY, ELECTIONS, QUALITY_RULES, SOURCE, THRESHOLD } from './shared/dataSource';
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
    body: (
      <>
        <p>
          {SOURCE.name}, elecciones federales 2009–2024: {SOURCE.files}, {SOURCE.records}, revisados
          el {SOURCE.audited}. Mapas y claves territoriales: {SOURCE.geography}.
        </p>
        <p>
          Cada cifra corresponde a la jornada de su elección. Copia de datos del {DATA_COPY.date}.{' '}
          {DATA_COPY.status}.
        </p>
      </>
    ),
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
        <div className={styles.scroll}>
          <table className={styles.table}>
            <caption>Registros sin dato y participación nacional por elección</caption>
            <thead>
              <tr>
                <th scope="col">Elección</th>
                <th scope="col">Jornada</th>
                <th scope="col" className={styles.number}>
                  Sin dato
                </th>
                <th scope="col" className={styles.number}>
                  Participación
                </th>
                <th scope="col" className={styles.number}>
                  Municipios con cifra
                </th>
              </tr>
            </thead>
            <tbody>
              {ELECTIONS.map((e) => (
                <tr key={e.year}>
                  <th scope="row">
                    {e.year} · {e.type.toLowerCase()}
                  </th>
                  <td>{e.date}</td>
                  <td className={styles.number}>{e.noData}</td>
                  <td className={styles.number}>{e.turnout}</td>
                  <td className={styles.number}>{e.municipalities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: 'exclusiones',
    title: 'Qué se excluye',
    icon: 'minus',
    tone: 'violet',
    body: (
      <>
        <p>Reglas de calidad aplicadas y cuántos registros afectó cada una.</p>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <caption>Reglas de calidad</caption>
            <thead>
              <tr>
                <th scope="col">Regla</th>
                <th scope="col">Afectados</th>
                <th scope="col">Qué hacemos</th>
              </tr>
            </thead>
            <tbody>
              {QUALITY_RULES.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.rule}</th>
                  <td>{r.affected}</td>
                  <td>{r.treatment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: 'umbral',
    title: 'Umbral de publicación',
    icon: 'users',
    tone: 'indigo',
    body: `Una cifra con lista nominal menor a ${THRESHOLD} personas no se publica, para no identificar a grupos pequeños. Si es un municipio, se muestra su entidad con una nota; si es un grupo de edad o de sexo, se omite solo ese grupo.`,
  },
  {
    id: 'grupos',
    title: 'Grupos de edad y tipo de elección',
    icon: 'calendar',
    tone: 'neutral',
    body: 'Cinco grupos: 18–24, 25–34, 35–44, 45–59 y 60 + (hasta 110 años). La edad simple no se publica. Presidenciales (2012, 2018, 2024) e intermedias (2009, 2015, 2021) siempre se distinguen.',
  },
  {
    id: 'arquetipos',
    title: 'Arquetipos municipales',
    icon: 'star',
    tone: 'brand',
    body: 'K-medias con k = 5 sobre cuatro rasgos de cada municipio frente al país: nivel, efecto presidencial, tendencia por década y volatilidad, en puntos. Se recortan a los percentiles 1–99 y se estandarizan; k = 5 tiene el BIC mínimo y su estabilidad por bootstrap da un ARI medio de 0.86. Solo se clasifican municipios con al menos 5 elecciones.',
  },
  {
    id: 'validacion',
    title: 'Validación',
    icon: 'check',
    tone: 'mint',
    body: 'Cada cifra se compara con la publicada por el INE y una diferencia mayor a 1 punto bloquea la publicación. En esta copia el cotejo aún está pendiente; la participación nacional coincide con la calculada en la auditoría de la fuente en las 6 elecciones.',
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
      lead={`Cómo calculamos cada cifra de ReVoto. Datos del ${DATA_COPY.date}.`}
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
