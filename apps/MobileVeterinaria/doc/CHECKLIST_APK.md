# Checklist APK Release - MobileVeterinaria

Usa esta lista rápida antes y durante la generación del APK release local.

## ✅ 1. Preparación del entorno

- [ ] Estoy en Windows PowerShell.
- [ ] Estoy ubicado en la carpeta del proyecto:
  - `c:\Marcela\UCEM\Proyectos\ProyectoCuartaGen2\apps\MobileVeterinaria`
- [ ] Ejecuté instalación de dependencias:
  - `npm install`
- [ ] Tengo JDK 17 instalado.
- [ ] `JAVA_HOME` está configurado correctamente.
- [ ] `ANDROID_HOME` está configurado correctamente.
- [ ] Android SDK + Build Tools están instalados.
- [ ] Licencias del SDK aceptadas.

## ✅ 2. Inicialización de Expo/EAS

- [ ] EAS CLI instalado:
  - `npm install -g eas-cli`
- [ ] Sesión iniciada en Expo:
  - `eas login`
- [ ] Variable de entorno creada en Expo/EAS (para build remoto):
  - `EXPO_PUBLIC_API_BASE`
  - Valor esperado (actual): `https://api-veterinaria-jh6k.onrender.com/api/v1`
  - Configurada en el entorno del perfil de build (`preview` y/o `production`)
- [ ] Proyecto EAS configurado (si aplica):
  - `eas build:configure`
- [ ] Proyecto nativo generado:
  - `npx expo prebuild -p android`

## ✅ 3. Ejecución con scripts (EAS remoto)

- [ ] Estoy en la carpeta:
  - `c:\Marcela\UCEM\Proyectos\ProyectoCuartaGen2\apps\MobileVeterinaria\doc`
- [ ] Si PowerShell bloquea scripts, ejecuté:
  - `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
- [ ] Ejecuté build con script:
  - `.\eas-build-preview.ps1`
- [ ] Si quiero seguimiento automático, ejecuté:
  - `.\eas-build-preview.ps1 -Monitor`
- [ ] Si ya tengo ID de build, monitoreo manual con:
  - `.\eas-monitor-build.ps1 -BuildId "TU_BUILD_ID"`
- [ ] Verifiqué que el estado final del build en EAS sea `FINISHED`.

## ✅ 4. Firma de release

- [ ] Keystore creado (`release-key.keystore`) en `android/app`.
- [ ] Guardé contraseña del keystore.
- [ ] Guardé contraseña del alias.
- [ ] `android/gradle.properties` contiene:
  - `MYAPP_UPLOAD_STORE_FILE`
  - `MYAPP_UPLOAD_KEY_ALIAS`
  - `MYAPP_UPLOAD_STORE_PASSWORD`
  - `MYAPP_UPLOAD_KEY_PASSWORD`
- [ ] `android/app/build.gradle` tiene `signingConfigs.release` y `buildTypes.release` con `signingConfig signingConfigs.release`.

## ✅ 5. Compilación release

- [ ] Estoy en la carpeta:
  - `c:\Marcela\UCEM\Proyectos\ProyectoCuartaGen2\apps\MobileVeterinaria\android`
- [ ] Ejecuté limpieza:
  - `.\gradlew.bat clean`
- [ ] Ejecuté build release:
  - `.\gradlew.bat assembleRelease`

## ✅ 6. Verificación de salida

- [ ] El APK existe en:
  - `android\app\build\outputs\apk\release\app-release.apk`
- [ ] Si fue build remoto con EAS, descargué el APK desde `artifacts.buildUrl`.
- [ ] Instalé el APK en un dispositivo Android real.
- [ ] Verifiqué login y navegación principal.
- [ ] Verifiqué consumo de API en ambiente esperado.

## ✅ 7. Si falla build

- [ ] Revisé error completo en consola (primer error real, no el último).
- [ ] Revalidé `JAVA_HOME` y versión de Java.
- [ ] Revalidé SDK Android y Build Tools.
- [ ] Revalidé rutas/credenciales de firma en `gradle.properties`.
- [ ] Ejecuté nuevamente:
  - `.\gradlew.bat clean`
  - `.\gradlew.bat assembleRelease`
- [ ] Si falla EAS remoto, ejecuté monitoreo y revisé logs del build:
  - `.\eas-monitor-build.ps1 -BuildId "TU_BUILD_ID"`

---

Referencia detallada: ver `GENERACION_APK.md` en esta misma carpeta.
