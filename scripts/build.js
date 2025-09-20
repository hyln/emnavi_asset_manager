const Path = require('path');
const Chalk = require('chalk');
const FileSystem = require('fs');
const Vite = require('vite');
const compileTs = require('./private/tsc');



function buildRenderer() {
    return Vite.build({
        configFile: Path.join(__dirname, '..', 'vite.config.js'),
        base: './',
        mode: 'production'
    });
}

function buildMain() {
    const mainPath = Path.join(__dirname, '..', 'src', 'main');
    return compileTs(mainPath);
}
function copyStatic() {
    const src = Path.join(__dirname, '..', 'src', 'main', 'static');
    const dest = Path.join(__dirname, '..', 'build', 'main', 'static');

    if (FileSystem.existsSync(src)) {
        FileSystem.cpSync(src, dest, { recursive: true });
        console.log(Chalk.cyan('Copied static resources to build/main/static.'));
    } else {
        console.log(Chalk.yellow('No static folder found to copy.'));
    }
}
FileSystem.rmSync(Path.join(__dirname, '..', 'build'), {
    recursive: true,
    force: true,
})

console.log(Chalk.blueBright('Transpiling renderer & main...'));

Promise.allSettled([
    buildRenderer(),
    buildMain(),
]).then(() => {
    // copyStatic(); // <== 添加这句
    console.log(Chalk.greenBright('Renderer & main successfully transpiled! (ready to be built with electron-builder)'));
});
