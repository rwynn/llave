# llave

llave is an [Electron](https://electron.atom.io/) based UI for the [Ironclad](https://github.com/dmulholland/ironclad) password manager. If you
landed here but prefer to manage your passwords in the terminal, Ironclad is a good choice.

### using llave

You can install llave using the following procedure:

* Download the latest release of ironclad for your platform from the [ironclad Releases](https://github.com/dmulholland/ironclad/releases) page.

* Add the ironclad binary to your PATH.  

* Download the latest llave app.esar file from the [llave Releases](https://github.com/rwynn/llave/releases) page.

* Download the latest Electron release for your platform from the [Electron Release](https://github.com/electron/electron/releases) page.

* Extract the Electron release to your filesystem.  Copy the llave app.esar file to the following location:

On macOS:

    electron/Electron.app/Contents/Resources

On Windows and Linux:

    electron/resources
    
You are now ready to run llave.

You can do so by double clicking `electron` or `electron.exe`  from the electron folder.

### developing llave

* Follow the first 2 steps in using llave to install ironclad.

* Clone the llave repository and install nodejs.

* Run `npm install` from the root llave folder.

* Run `npm run dev` to start Webpack.

* In another terminal window run `npm start` to start Electron.

You are now running llave in development mode.

Changes made to the react application will cause Webpack to rebuild llave.

### packaging llave

* Follow the first 3 steps from developing llave.

* Run `npm run package` to create an app.esar file in the build folder

* Follow the steps in using llave substituting your app.esar file for the one in step 3. 

### llave design

llave is primary a React app running in a renderer process in Electron.  For communicating with
the password manager, the React app sends IPC calls to the main process.  The main process spawns
the ironclad command with appropriate arguments and returns results to the renderer process.

llave tries to offload as much as possible to the ironclad command.  Since ironclad is not packaged
with llave but remains a separate binary, it is possible to update the password manager without any
changes to llave itself.  

llave is currently a desktop only password manager shell.  

### credits

special thanks to the following:

* [react-electron-starter](https://github.com/alanbsmith/react-electron-starter)

* [ironclad](https://github.com/dmulholland/ironclad) of course

* my Spanish teachers

