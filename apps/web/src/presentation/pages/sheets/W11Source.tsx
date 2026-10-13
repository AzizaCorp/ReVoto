import { Button, DataList, SheetTemplate, Text } from '@/presentation/components';
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
          <Button href="https://www.ine.mx/transparencia/datos-abiertos/">
            Portal de datos abiertos del INE
          </Button>
          <Button variant="text">Copiar cita</Button>
        </>
      }
    >
      <Text variant="meta">Desde: {nav.stepName ?? '[Pantalla de origen]'}</Text>
      <DataList
        items={[
          { term: 'Fuente', value: 'INE · DECEYEC · Conteos censales de participación' },
          { term: 'Elección', value: 'Federal [año] ([fecha])' },
          { term: 'Territorio', value: '[Municipio], [Entidad]' },
          { term: 'Fecha de corte', value: '[dd/mm/aaaa]' },
          { term: 'Fórmula', value: 'Votaron ÷ (lista nominal − sin dato)' },
          {
            term: 'Se excluyeron',
            value:
              '[—.— %] de registros sin dato de participación. No son abstención: el registro no trae información.',
          },
        ]}
      />
    </SheetTemplate>
  );
}
