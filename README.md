# Chantico

Chantico es un proyecto de Laravel que permite gestionar las ventas de un cafeteria.

## Entorno de Desarrollo

copiar el archivo `.env.example` a `.env` y ajustar los valores de las variables de entorno.

## Docker

Para ejecutar el proyecto se debe usar los comandos:

```bash
docker compose up --build -d
```

Para detener el proyecto se debe usar el comando:

```bash
docker compose down
```

### Migrations
se agrego columna correr migraciones

```
php artisan migrate
```

## Flujo de ramas (Git)

```
main
 └── develop
      └── feat/nueva-funcionalidad
```

| Rama | Propósito |
|---|---|
| `main` | Código estable listo para producción |
| `develop` | Integración de features en desarrollo |
| `feat/*` | Nueva funcionalidad, creada desde `develop` |

**Pasos para una nueva funcionalidad:**

```bash
git checkout develop
git pull origin develop
git checkout -b feat/nombre-funcionalidad

# ... desarrollo ...

# PR de feat/nombre-funcionalidad → develop
```

Cuando `develop` esté estable se hace el merge final a `main`.

---

### Seeds

se agregaron iconos, correr manualmente 
```
php artisan db:seed --class=CategoriesIconsSeeder
php artisan db:seed --class={SeederName}
```