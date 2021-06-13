# Webpack userscripts
Krunker cheats with shared libraries, built with Webpack.

To use the userscripts, you will need [Tampermonkey](https://www.tampermonkey.net/).

## Where are the userscripts?

Pre-built userscripts are found [here](https://y9x.github.io/userscripts/).

## Building

To build the userscripts, you will need [NodeJS](https://nodejs.org/en/download/).

Quickstart:

```sh
git clone https://github.com/y9x/webpack.git

cd webpack

npm install

node ./index.js -once
```

If the build was successful, there will be a folder named `dist` in the same directory that contains the userscripts.