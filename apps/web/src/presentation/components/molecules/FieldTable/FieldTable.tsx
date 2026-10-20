import styles from './FieldTable.module.css';

export type FieldType = 'entero' | 'decimal' | 'texto' | 'booleano';

export interface Field {
  name: string;
  type: FieldType;
  description: string;
  example: string;
}

/**
 * Data dictionary table (W-19). It is a real table on every breakpoint; below 768 px each row is
 * drawn as a card.
 */
export function FieldTable({ caption, fields }: { caption: string; fields: readonly Field[] }) {
  return (
    <table className={styles.fieldTable}>
      <caption className={styles.caption}>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Campo</th>
          <th scope="col">Tipo</th>
          <th scope="col">Descripción</th>
          <th scope="col">Ejemplo</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((f) => (
          <tr key={f.name}>
            <th scope="row" className={styles.name}>
              <code>{f.name}</code>
            </th>
            <td className={styles.typeCell}>
              <span className={[styles.type, styles[f.type]].join(' ')}>{f.type}</span>
            </td>
            <td className={styles.description}>{f.description}</td>
            <td className={styles.example} data-label="Ejemplo:">
              <code>{f.example}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
