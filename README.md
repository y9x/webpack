# Webpack userscripts
Krunker cheats with shared libraries, built with Webpack.

To use the userscripts, you will need [Tampermonkey](https://www.tampermonkey.net/) installed.

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

Build output is in the `dist/` folder