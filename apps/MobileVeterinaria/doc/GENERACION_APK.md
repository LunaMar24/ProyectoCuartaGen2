# Generación de APK - MobileVeterinaria

Este documento describe los pasos para preparar el proyecto y generar un APK.

## 1) Inicialización (instalación y configuración de EAS)

> Ejecutar en Windows PowerShell, desde la raíz de `MobileVeterinaria`.

### 1.1 Ir al proyecto

```powershell
cd c:\Marcela\UCEM\Proyectos\ProyectoCuartaGen2\apps\MobileVeterinaria
```

### 1.2 Instalar dependencias del proyecto

```powershell
npm install
```

### 1.3 Instalar EAS CLI

```powershell
npm install -g eas-cli
```

### 1.4 Iniciar sesión en Expo

```powershell
eas login
```

### 1.4.1 Configurar variable de entorno en Expo/EAS (obligatorio para build remoto)

Además del archivo `.env` local, en Expo/EAS debes crear la variable:

```text
EXPO_PUBLIC_API_BASE
```

con el valor de tu API (ejemplo):

```text
https://api-veterinaria-jh6k.onrender.com/api/v1
```

Esto se configura en el proyecto de Expo (Environment Variables), en el entorno usado por el perfil de build (por ejemplo, `preview` y/o `production`).

Si no se configura en Expo/EAS, el APK generado en la nube puede quedar sin URL de backend aunque exista `.env` en tu máquina local.

### 1.5 Configurar EAS en el proyecto (si aún no existe `eas.json`)

```powershell
eas build:configure
```

### 1.6 Generar proyecto nativo Android

```powershell
npx expo prebuild -p android
```

---

## 2) Generación del APK (Release local)

### 2.1 Crear keystore de firma (una sola vez)

```powershell
cd c:\Marcela\UCEM\Proyectos\ProyectoCuartaGen2\apps\MobileVeterinaria\android\app
keytool -genkeypair -v -storetype PKCS12 -keystore release-key.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

> Guardar la contraseña del keystore y del alias en un lugar seguro.

### 2.2 Configurar `gradle.properties`

Archivo: `android/gradle.properties`

Agregar al final:

```properties
MYAPP_UPLOAD_STORE_FILE=release-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=release-key
MYAPP_UPLOAD_STORE_PASSWORD=TU_PASSWORD_KEYSTORE
MYAPP_UPLOAD_KEY_PASSWORD=TU_PASSWORD_KEY
```

### 2.3 Configurar firma release en `build.gradle`

Archivo: `android/app/build.gradle`

Verificar que existan estos bloques dentro de `android { ... }`:

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        shrinkResources false
    }
}
```

### 2.4 Compilar APK release

```powershell
cd c:\Marcela\UCEM\Proyectos\ProyectoCuartaGen2\apps\MobileVeterinaria\android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

### 2.5 Ubicación del APK generado

```text
c:\Marcela\UCEM\Proyectos\ProyectoCuartaGen2\apps\MobileVeterinaria\android\app\build\outputs\apk\release\app-release.apk
```

---

## Notas rápidas de diagnóstico

Si falla Gradle, revisar:

- `JAVA_HOME` apuntando a JDK 17.
- `ANDROID_HOME` configurado.
- SDK de Android instalado (Platform + Build Tools).
- Licencias de SDK aceptadas desde Android Studio.

---

## 3) Scripts en `doc` para automatizar EAS

Se agregaron scripts PowerShell ejecutables desde esta carpeta `doc`:

- `eas-build-preview.ps1`: lanza el build EAS desde la ruta correcta `apps/MobileVeterinaria`.
- `eas-monitor-build.ps1`: monitorea un build por ID hasta que finalice.

### 3.1 Ejecutar build (y opcionalmente monitorear)

Desde `apps\MobileVeterinaria\doc`:

```powershell
.\eas-build-preview.ps1
```

Con monitoreo automático del mismo build:

```powershell
.\eas-build-preview.ps1 -Monitor
```

### 3.2 Monitorear un build existente

```powershell
.\eas-monitor-build.ps1 -BuildId "168dd101-0319-4358-b4e2-e971ab8fb3d0"
```

Parámetros útiles:

- `-IntervalSeconds 45` (frecuencia de consulta).
- `-MaxChecks 120` (cantidad máxima de consultas).

### 3.3 Si PowerShell bloquea la ejecución

Ejecutar una vez en la sesión actual:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
