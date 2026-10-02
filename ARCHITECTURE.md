# ARCHITECTURE.md — mcp-17track

Servidor MCP de seguimiento de paquetes con la API gratuita de 17TRACK.

## Clientes y versiones
- Un servidor MCP por stdio (`mcp-17track` 1.0.0, Node >=20, TypeScript): `src/index.ts`, `src/server.ts`, `src/client.ts`. Sin web ni iOS.
- **Ruta AgentGateway: ninguna.** El seguimiento de envíos de la tienda lo cubren las herramientas de etiquetas/estado de Skirmshop Labels (`labels_shipment_status`, `labels_latest_order_status`) y `brain_tracking_lookup` de `/brain`.
- Qué NO hace: no crea envíos, no cambia estados en Shopify ni Picqer, no guarda histórico.

## Dependencias en ambos sentidos
- **Depende de:** la API de 17TRACK (clave en el entorno), `@modelcontextprotocol/sdk ^1.27.1`, `zod ^4.3.6`.
- **Quién depende de él:** nadie por manifiesto (grep en `~/k8s`).
- Sin `CONTRACTS.yaml`.

## Stack
- TypeScript ^5.9, `tsc` a `dist/`, SDK MCP, `zod`. Sin base de datos.

## Componentes compartidos
- `src/client.ts` (cliente de la API); ninguno compartido con otros repos.

## Cómo se construye
- Cliente HTTP en `client.ts` y registro de herramientas en `server.ts`; la entrada se valida con `zod`.

## Tests
- No hay tests ni directorio `test/`.

## CI/CD y despliegue
- Sin workflows, sin imagen, sin ArgoCD. `npm run build` genera `dist/`. Tronco: `main`.

## Decisiones y trampas
- Cuota gratuita de 17TRACK: no usarlo en bucles sobre todos los pedidos.
- Historial del repo no verificado en esta revisión (sin `git log`).

## Reutilización
- Antes de ampliar: `skirmshop-labels` (estado de envío) y `brain_tracking_lookup`. Búsquedas: grep de `17track` en `~/k8s` (sin consumidores), lectura de `package.json` y lista de ficheros.
