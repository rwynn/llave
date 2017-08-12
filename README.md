# llave

llave is an [Electron](https://electron.atom.io/) based UI for the [Ironclad](https://github.com/dmulholland/ironclad) password manager. If you
landed here but prefer to manage your passwords in the terminal, Ironclad is a good choice.

<img src="https://raw.github.com/rwynn/llave/master/screens/entries.png"/>

### using llave

You can install llave using the following procedure:

* Download and extract the latest llave `llave.zip` file from the [llave Releases](https://github.com/rwynn/llave/releases) page.

* Download and extract the latest Electron release for your platform from the [Electron Release](https://github.com/electron/electron/releases) page.

* Copy both the llave `app.esar` file and `app.esar.unpacked` folder from `llave.zip` to the following location:

On macOS (you will need to right click Electron.app and `Show Package Contents`):

    electron/Electron.app/Contents/Resources

On Windows and Linux:

    electron/resources
    
You are now ready to run llave.

You can do so by double clicking `electron`, `Electron`, or `electron.exe` from the electron folder.

### developing llave

* Git clone the llave repository and install nodejs.

* Run `npm install` from the root llave folder.

* Run `npm run dev` to start Webpack.

* In another terminal window run `npm start` to start Electron.

You are now running llave in development mode.

Changes made to the react application will cause Webpack to rebuild llave.

### packaging llave

* Clone the llave repository and install nodejs.

* Run `npm run package` to create an `app.esar` file and an `app.esar.unpacked` directory in the build folder

* Follow the steps in using llave substituting your own app.esar file and app.esar.unpacked folder for the ones in step 3. 

### llave design

llave is primary a React app running in a renderer process in Electron.  For communicating with
the password manager, the React app sends IPC calls to the main process.  The main process executes
the ironclad command with appropriate arguments and returns results to the renderer process.

llave is currently a desktop only password manager shell.  

### credits

special thanks to the following:

* [react-electron-starter](https://github.com/alanbsmith/react-electron-starter)

* [ironclad](https://github.com/dmulholland/ironclad) of course

* my Spanish teachers

