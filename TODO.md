## API

1. Documentar toda la api en swagger

## IMPORTAR

1. El botón de importar que tenga el verde acapulco
2. Preparar la aplicación para tener conectores, todo el sistema actual de importación es para exceles de n26, pero poder preparar alguna forma fácil de añadir nuevos conectores a nivel de parser.

## DASHBOARD

1. Añadir los datos a las gráficas de chart
2. Hacer que el background Por cada 10 € que ingreso, gasto 0 cambie de color si estoy bien medio o regular
3. Añadir en filtro temporal una opción de añadir parametros personalidados desde-hasta (siguiendo el estilo minimalista de la app)

## TRANSACCIONES

1. Mejorar las gráficas que se muestran
2. Poder añadir una manualmente con el botón de +
3. Elimina Total transactions: 0 Filtered transactions: 0 Grouped transactions: 0
4. Ocultar debe dejar el concepto pero como si estuviera desactivado, guardar en bbdd y excluirlo de los cálculos.
5. Añadir i18n español e inglés completo

# Historia de usuario

Título: Categorizar y re-categorizar gastos en la app

Como usuario que importa mis gastos desde Excel
Quiero que la app los categorice automáticamente en categorías editables
Para poder identificar fácilmente si son inversión, gasto discrecional o gasto esencial
Y que el sistema aprenda de mis correcciones.

# Criterios de aceptación

Scenario: Carga de gastos desde Excel
Given que importo un archivo Excel con mis movimientos
When se procesan los datos
Then cada gasto debe mostrarse con: fecha, descripción, cantidad, categoría inicial y tipo (esencial/discrecional/inversión) en la ventana de preview

Scenario: Gestión de categorías
Given que existen categorías predefinidas
When accedo al gestor de categorías
Then debo poder crear nuevas categorías
And debo poder editar el nombre de una categoría
And debo poder cambiar el tipo asociado (ej: pasar de discrecional a esencial)

Scenario: Categorización automática basada en historial
Given un gasto con descripción que ya fue categorizado previamente
When se vuelva a importar un gasto con el mismo proveedor
Then el sistema debe asignarle la misma categoría aprendida

Scenario: Corrección manual de categoría
Given un gasto mal categorizado
When el usuario lo edite y seleccione otra categoría
Then el sistema debe guardar esa corrección para futuras importaciones y darte la opción de cambiar todos incluyendo los anteriores

Scenario: Visualización por tipo de gasto
Given que los gastos tienen asignado un tipo (esencial, discrecional, inversión)
When visualizo mi panel
Then debo poder ver agrupados mis gastos por categoría
And también por tipo

Scenario: Gastos sin categorizar
Given que un gasto no coincide con reglas ni historial
When se muestre en la lista
Then aparecerá como "Sin categorizar" hasta que el usuario lo edite

En transacciones deberás mostrar las categorias existentes y un label pequeño si es esencial, discrecional o inversión (en base a la categoria)

En los filtros debo poder hacerlo por categoria y por tipo (esencial, discrecional, inversión)
