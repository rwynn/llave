# llave

llave provides [Electron](https://electron.atom.io/) and [Cordova](https://cordova.apache.org/) 
based UIs for the [Ironclad](https://github.com/dmulholland/ironclad) password manager.

<img src="https://raw.githubusercontent.com/rwynn/llave/master/screens/entries.png"/>

## llave design

llave allows you to have as many encrypted database files as you like.  Databases are encrypted using industry-standard
cryptographic protocols.  Databases are regular files on your device.  Databases are accessed using the 
host platform's native file chooser allowing you to load files from any location supported by the chooser: local or remote.

If you would like to sync encrypted password databases between multiple devices you can use any avenue supported by your platform such
as iCloud, Google Drive, Dropbox, OneDrive, microSD, etc. llave does not provide storage for your database files. You control where the database files
are stored.  

llave for the desktop allows you to export the unencrypted contents of your password databases. Unecrypted database files
are plain JSON text.  

## llave for the desktop

On the desktop llave runs as an Electron application.  In this environment llave communicates with the Ironclad binary to
provide read/write access to your encrypted password databases.  

### using llave on the desktop

You can install llave for the desktop using the following procedure:

* Download and extract the latest llave `llave.zip` file from the [llave Releases](https://github.com/rwynn/llave/releases) page.

* Download and extract the Electron 3.1.4 release for your platform from the [Electron 3.1.4 Release](https://github.com/electron/electron/releases/tag/v3.1.4) page.

* Copy both the llave `app.esar` file and `app.esar.unpacked` folder from `llave.zip` to the following location:

On macOS (you will need to right click Electron.app and `Show Package Contents`):

    electron/Electron.app/Contents/Resources

On Windows and Linux:

    electron/resources
    
You are now ready to run llave.

You can do so by double clicking `electron`, `Electron`, or `electron.exe` from the electron folder.

### packaging llave for the desktop

* Clone the llave repository and install nodejs.

* Run `npm install` to install dependencies

* Run `npm run package` to create an `app.esar` file and an `app.esar.unpacked` directory in the build folder

* Follow the steps in `using llave on the desktop` substituting your own app.esar file and app.esar.unpacked folder for the ones in step 3. 

## llave for your mobile device

On mobile llave runs as an Apache Cordova application.  In this environment llave provides a read-only view of your
password databases.  It uses the [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/) provided by your mobile
browser to decrypt the password database. Your mobile browser will need to support the Web Cryptography API - 
specifically `window.crypto` and `window.crypto.subtle` without prefixes like msCrypto or webkitCrypto.

### packaging llave for mobile

* Clone the llave repository and install nodejs.

* Run `npm install` to install dependencies

* Run `npm run package` to create a `cordova/www` directory in the build folder

* Refer to the Getting Started instructions at [Apache Cordova](https://cordova.apache.org/) to create and run a project.

* Copy the contents of the `cordova/www` directory from the llave build folder to the `www` directory in your Cordova project and re-run the project.

* Follow the instructions on the Cordova website for building and deploying a signed mobile application from your project.

### emulating llave for mobile

If you simply want to emulate the llave for mobile application for local testing in your browser 
without creating a full blown mobile app with Cordova then you can do the following:

* Clone the llave repository and install nodejs.

* Run `npm install` to install dependencies

* Run `npm run package` to create a `web` directory in the build folder

* Copy the contents of the `web` directory to a web server and load in your browser

## developing llave

* Git clone the llave repository and install nodejs.

* Run `npm install` from the root llave folder.

* Run `npm run chmod` to ensure the ironclad binaries are executable.

* Run `node server.js` to start Webpack.

* In another terminal window run `npm start` to start Electron.

* The web/mobile version is also now available from your browser at `http://localhost:8080/web`.

You are now running llave in development mode.

Changes made to the React application will cause Webpack to rebuild llave.

## credits

special thanks to the following:

* [react-electron-starter](https://github.com/alanbsmith/react-electron-starter)

* [ironclad](https://github.com/dmulholland/ironclad) of course

* My Spanish teachers

