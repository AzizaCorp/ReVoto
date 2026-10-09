# Requisitos no funcionales clave

> Fuente: SRS Hackathon INE §7.

| ID | Requisito | Umbral | Cómo se verifica |
| --- | --- | --- | --- |
| RNF-01 | Carga inicial de la versión ligera | ≤ 500 KB transferidos, primera visita sin caché | `npm run check:budget` + inspección de red |
| RNF-02 | Primera pantalla visible en red lenta | ≤ 3 s en 3G rápido, gama media | Medición en navegador |
| RNF-03 | Cambio entre pantallas | ≤ 300 ms | Medición en dispositivos |
| RNF-04 | Archivo de datos por consulta territorial | ≤ 300 KB por entidad | `npm run check:budget` |
| RNF-05 | Disponibilidad | Sin interrupciones del 30/10 al cierre de la evaluación | Revisión manual diaria |
| RNF-06 | Compatibilidad | Chrome, Safari, Firefox vigentes; iPhone 17 Pro Max y Motorola G82 | Prueba manual |
| RNF-07 | Accesibilidad | WCAG 2.2 AA, 100 % de criterios aplicables | Auditoría + lector de pantalla |
| RNF-08 | Contraste | ≥ 4.5:1 texto · ≥ 3:1 texto grande y gráficos | Herramienta de contraste |
| RNF-09 | Recorrido principal | ≤ 2 min | Prueba con usuarios |
| RNF-10 | Comprensión | > 70 % identifica mensaje, territorio y periodo | Prueba con ≥ 5 personas |
| RNF-11 | Seguridad | HTTPS TLS 1.2+, cero recursos HTTP | Inspección de red |
| RNF-12 | Analítica | Anónima, sin identificadores ni rastreo entre sitios | Revisión de configuración |
| RNF-13 | Privacidad | Cero campos de datos personales | Inspección |
| RNF-14 | Reidentificación | 100 % de agregados sobre el umbral RN-05 | Reporte del pipeline |
| RNF-15 | Neutralidad | Cero menciones partidistas | Revisión por pares |
| RNF-16 | Reproducibilidad | Pipeline desde cero con un solo comando | Prueba en máquina limpia |
| RNF-17 | Portabilidad | Sitio estático sin servidor de aplicaciones | Inspección de arquitectura |
| RNF-18 | Lenguaje | Español claro, tecnicismos explicados | Revisión editorial |

## Diseño (manual de wireframes)

- Marco base 360 × 760 px; zona superior 56 px, contenido 632 px sin scroll, zona inferior 72 px.
- Retícula de 4 columnas, módulo de 8 px, márgenes de 16 px.
- Un solo botón primario por pantalla; acciones en el tercio inferior.
- Lectura fácil: cuerpo de 20 px, sin animaciones.
