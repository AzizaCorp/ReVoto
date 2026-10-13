import { Button, DataList, Notice, Pill, SheetTemplate } from '@/presentation/components';
import { useNavigation } from '@/presentation/providers/Navigation';

/** W-11 · Source sheet (RF-12, RN-10). Pending US-12: data of the figure it was opened from. */
export function W11Source() {
  const nav = useNavigation();
  return (
    <SheetTemplate
      open
      title="¿De dónde sale esta cifra?"
      onClose={nav.closeSheet}
      actions={
        <>
          <Button
            variant="primary"
            size="large"
            trailingIcon="share"
            fullWidth
            href="https://www.ine.mx/transparencia/datos-abiertos/"
          >
            Portal de datos abiertos del INE
          </Button>
          <Button icon="copy" fullWidth>
            Copiar cita
          </Button>
        </>
      }
    >
      <Pill number="Desde">{nav.stepName ?? '[Pantalla de origen]'}</Pill>
      <DataList
        items={[
          {
            term: 'Fuente',
            value: 'INE · DECEYEC · Conteos censales de participación',
            icon: 'info',
          },
          { term: 'Elección', value: 'Federal [año] ([fecha])', icon: 'calendar', tone: 'violet' },
          { term: 'Territorio', value: '[Municipio], [Entidad]', icon: 'pin', tone: 'indigo' },
          { term: 'Fecha de corte', value: '[dd/mm/aaaa]', icon: 'calendar', tone: 'neutral' },
          {
            term: 'Fórmula',
            value: 'Votaron ÷ (lista nominal − sin dato)',
            icon: 'chart',
            tone: 'brand-strong',
          },
        ]}
      />
      <Notice tone="pending">
        Se excluyeron [—.— %] de registros sin dato de participación. No son abstención: el registro
        no trae información.
      </Notice>
    </SheetTemplate>
  );
}
