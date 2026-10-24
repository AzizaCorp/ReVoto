import { Button, Notice } from '@/presentation/components';
import { useStory } from '@/presentation/providers/Story';

/** Load failure (W-17, CU-02 E1) or RN-05 notice for the screens of the story. */
export function DataStatus() {
  const story = useStory();
  if (story.status === 'error') {
    return (
      <Notice tone="error" title="No pudimos cargar las cifras">
        <Button variant="text" onClick={story.retry}>
          Reintentar
        </Button>
      </Notice>
    );
  }
  if (story.status === 'ready' && story.data.notice) {
    return (
      <Notice tone="threshold" title={`Mostramos ${story.data.own.territory.name}`}>
        Tu municipio tiene menos de 50 personas en la lista nominal; sus cifras no se publican para
        proteger la privacidad.
      </Notice>
    );
  }
  return null;
}
