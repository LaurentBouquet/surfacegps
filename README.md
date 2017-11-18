# SurfaceGPS 

SurfaceGPS is an application that calculates the area of a piece of land using the GPS sensor of a smartphone

_Note: SurfaceGPS requires Ionic CLI 3._


## Getting Started

To test this application :

1. Install the lastest version of the Ionic CLI 
[Ionic CLI](https://ionicframework.com/docs/cli/)

2. Run:
```bash
git clone https://laurentbouquet@bitbucket.org/joliciel/surfacegps.git
cd surfacegps
ionic serve -c
```


## Pages

SurfaceGPS loads with the `FirstRunPage` set to `TutorialPage` as the default. If the user has already gone through this page once, it will be skipped the next time he loads the app.

If the tutorial is skipped, the Welcome page will be displayed. This is the page titled `MainPage` which is set to be the `TabsPage` as the default.

The entry and main pages can be configured easily by updating the corresponding variables in [src/pages/pages.ts].


## Providers

The list of pieces is stored in SQLite and managed by the "provider" Items. 


## i18n

SurfaceGPS comes with internationalization (i18n) out of the box with [ngx-translate](https://github.com/ngx-translate/core). This makes it easy to change the text used in the app by modifying only one file. 


### Adding Languages

To add new languages, add new files to the `src/assets/i18n` directory, following the pattern of LANGCODE.json where LANGCODE is the language/locale code (ex: en/gb/de/es/etc.).


### Changing the Language

To change the language of the app, edit `src/app/app.component.ts` and modify `translate.use('en')` to use the LANGCODE from `src/assets/i18n/`


Thank you in advance for your contribution :-)


