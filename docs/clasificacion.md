# Clasificar un mes de movimientos

Happy Balance tiene tres caminos para poner categoría a un movimiento, de más
barato a más caro:

1. **Motor de reglas** (`category_patterns` + `merchant_aliases`). Automático en
   cada importación. Solo conoce comercios que ya ha visto.
2. **`scripts/hb`**, el CLI de este documento. Para el hueco que deja el motor:
   comercios nuevos, un viaje, la infraestructura de un negocio recién montado.
   Es el camino normal cuando el que clasifica es una persona o un agente.
3. **Pasada con LLM** (`POST /api/transactions/ai-categorize`). Opcional y
   apagada si no hay `ANTHROPIC_API_KEY`. Útil sin nadie delante; cuesta tokens.

## El CLI: dos llamadas por mes

`hb` vive junto al `docker-compose.yml` del despliegue y habla con Postgres a
través del contenedor, así que no necesita ni la API ni un token.

```sh
HB=/volume1/Docker/apps/happy-balance/scripts/hb

ssh nas "$HB backup"                      # siempre antes de escribir
ssh nas "$HB reglas"                      # lo que los patrones ya resuelven solos
ssh nas "$HB comercios --desde 2026-08-01"  # LEER: lo pendiente, agregado por comercio
```

`comercios` es la vista que importa: una línea por comercio con el número de
movimientos, el total, el rango de fechas y las descripciones distintas. Un mes
con 275 movimientos sin categoría cabe en ~120 líneas, no en 275.

Con eso se escribe un fichero de reglas y se aplica de una vez:

```sh
cat > /tmp/reglas.tsv <<'TSV'
STRIPE	Archivo Abisal	INCOME
SUPABASE	Archivo Abisal - Infra
BACKBLAZE%	Archivo Abisal - Infra
%DEEPSEERWEA%	Archivo Abisal - Infra
FACEBK %	Archivo Abisal - Marketing
Cuenta Principal	Movimiento entre cuentas
Cuenta de Ahorro	Movimiento entre cuentas
Cuenta Autónomos	Movimiento entre cuentas
desc:%Civitatis%	Viaje
TSV

ssh nas "$HB aplicar -" < /tmp/reglas.tsv
```

Separador **TAB**. El patrón se compara con `ILIKE`: sin comodines es exacto,
con `%…%` es «contiene». `desc:` compara contra la descripción en vez del
comercio, que es lo que hace falta cuando el comercio es `Unknown Merchant` y
la pista está en el concepto del Bizum. La tercera columna, opcional, restringe
a `INCOME`, `EXPENSE` o `INVESTMENT`.

Si dos reglas encajan en el mismo movimiento gana **el patrón más largo**, que
es el que se escribió con más intención.

### Lo que `aplicar` no te deja hacer

- **Categoría que no existe**: se lista como `patron_sin_categoria` y esa regla
  se ignora. No se crean categorías por accidente.
- **Categoría de tipo incompatible**: una categoría de ingreso sobre un gasto
  (o al revés) se cuenta en `rechazados` y **no se escribe**. Es el error que
  más cuesta detectar luego, porque la UI simplemente deja de pintar el
  movimiento.
- **Pisar trabajo previo**: solo toca movimientos sin categoría. Para corregir
  algo ya clasificado, `hb aplicar-ids` con los ids concretos.

Todo ocurre en una transacción: si una regla revienta, no se escribe ninguna.

### Cada regla aplicada deja un patrón

`aplicar` guarda cada patrón que ha servido con prioridad 60 — por encima de lo
heredado, por debajo de los patrones de negocio (90–100). El mes que viene esos
comercios los resuelve `hb reglas` sin que nadie escriba nada. El trabajo de
clasificar un comercio se hace una vez.

## Comprobar el resultado

```sh
ssh nas "$HB dudas"                        # lo que sigue sin categoría, por importe
ssh nas "$HB cuadre --desde 2026-07-01"    # ingresos / gastos / inversión / neto por mes
ssh nas "$HB resumen --desde 2026-08-01"   # desglose por categoría, bruto y neto
```

`bruto` frente a `neto` es donde se ven los enlaces: `neto` aplica
`isReimbursement` (cuenta 0) y `splitPercentage` (cuenta la parte que te toca).
Una categoría con bruto alto y neto bajo está reembolsada, no gastada.

## Cuentas propias y traspasos

Mover 1.000 € de la cuenta de ahorro a la principal no es ingreso ni gasto:
aparece como dos movimientos espejo cuyo comercio es el nombre de la otra
cuenta. `hb traspasos` busca esos pares (mismo importe, signos opuestos, ±3
días) y los manda a la categoría `no_compute` «Movimiento entre cuentas», que
el dashboard excluye.

**Un traspaso no es un reembolso.** Enlazar un gasto real con el traspaso que
lo cubrió pone `splitPercentage = 0` en el gasto, y entonces ese gasto cuenta
cero: desaparece de los libros. Los reembolsos son para dinero que pone *otra
persona*. Si `hb resumen` muestra una categoría con bruto alto y neto
sospechosamente bajo, esto es lo primero que hay que mirar.

## La pasada con LLM

Cuando no hay nadie para escribir reglas:

```sh
curl -s -X POST http://balance.nas/api/transactions/ai-categorize \
  -H 'Authorization: Bearer <token>' -H 'content-type: application/json' \
  -d '{"apply": false}'
```

Es simulación por defecto: devuelve propuestas con confianza y motivo, sin
escribir. La UI lo expone en el botón de IA de la barra de movimientos, donde se
revisan y se marcan las que se aplican. `learnPatterns: true` convierte lo
aceptado en patrones de prioridad 1, para no volver a gastar tokens en ese
comercio.

Sin `ANTHROPIC_API_KEY` el endpoint responde `configured: false` y no pasa nada
más; el resto de la aplicación es indiferente a que exista o no.
