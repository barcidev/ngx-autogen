# ngx-essentials-schematics

**ngx-essentials-schematics** es un conjunto de schematics diseñados para optimizar y estandarizar el flujo de trabajo en proyectos Angular. Esta librería proporciona herramientas de generación de código que siguen las mejores prácticas, permitiendo a los desarrolladores ahorrar tiempo en tareas repetitivas y configuración de arquitectura.

## 🚀 Características

El proyecto se lanza inicialmente con un enfoque en la gestión de estado, pero está diseñado para crecer:

- **Store Schematic**: Nuestro primer schematic disponible. Permite generar automáticamente toda la estructura necesaria para un store basado en signals (NGRX-Signals), facilitando la integración rápida y escalable de la gestión de estado en tus aplicaciones.

## 📅 Próximamente

**ngx-essentials-schematics** es un proyecto en evolución continua. Se irán agregando progresivamente nuevas herramientas y schematics para cubrir más aspectos del desarrollo en Angular, como:

- Generación de servicios y utilidades.
- Scaffolding para componentes avanzados.

## 📦 Instalación

Puedes instalar el paquete en tu proyecto Angular mediante angular cli:

```bash
ng add @jpalacio/ngx-essentials-schematics
```

## 🛠️ Uso

### Generar un Store

Para utilizar el schematic de store, ejecuta el siguiente comando en tu CLI de Angular:

```bash
ng g app-store --name="nombreDelStore"
```

Sigue las instrucciones en consola para configurar tu store según tus necesidades.

## 📄 Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
