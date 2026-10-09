import { DatosNoDisponibles } from '@/application';
import type { ManifiestoDto } from '@revoto/contracts';

type Fetch = typeof fetch;

/**
 * Lee los JSON estáticos publicados en /data (DIS §5.1):
 * 1. Pide manifest.json sin caché una vez por visita para fijar la versión de datos.
 * 2. Pide cada archivo dentro de /data/<version_datos>/, que es inmutable y se cachea un año.
 * Traduce cualquier falla a DatosNoDisponibles, el error que entiende la aplicación.
 */
export class ClienteJson {
  private manifiesto?: Promise<ManifiestoDto>;
  private readonly cache = new Map<string, Promise<unknown>>();

  constructor(
    private readonly base = '/data',
    private readonly fetcher: Fetch = (...args) => fetch(...args),
  ) {}

  async leer<T>(ruta: string): Promise<T> {
    const { version_datos } = await this.versionVigente();
    const url = `${this.base}/${version_datos}/${ruta}`;
    let promesa = this.cache.get(url) as Promise<T> | undefined;
    if (!promesa) {
      promesa = this.obtener<T>(url).catch((error: unknown) => {
        this.cache.delete(url); // permite reintentar (W-17)
        throw error;
      });
      this.cache.set(url, promesa);
    }
    return promesa;
  }

  private versionVigente(): Promise<ManifiestoDto> {
    this.manifiesto ??= this.obtener<ManifiestoDto>(`${this.base}/manifest.json`, {
      cache: 'no-cache',
    }).catch((error: unknown) => {
      this.manifiesto = undefined;
      throw error;
    });
    return this.manifiesto;
  }

  private async obtener<T>(url: string, init?: RequestInit): Promise<T> {
    let respuesta: Response;
    try {
      respuesta = await this.fetcher(url, init);
    } catch {
      throw new DatosNoDisponibles(url, 'red');
    }
    if (!respuesta.ok) throw new DatosNoDisponibles(url, 'no-encontrado');
    try {
      return (await respuesta.json()) as T;
    } catch {
      throw new DatosNoDisponibles(url, 'invalido');
    }
  }
}
