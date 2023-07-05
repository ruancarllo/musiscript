const TypeScript = require('typescript');
const Sass = require('sass');

const Electron = require('electron');

const fs = require('fs');
const path = require('path');

function removeDirectory(directoryPath) {
	if (!fs.existsSync(directoryPath)) return;

	fs.readdirSync(directoryPath).forEach((fileName) => {
		let analyzingPath = `${directoryPath}/${fileName}`;
		if (fs.statSync(analyzingPath).isDirectory()) removeDirectory(analyzingPath);
		if (fs.statSync(analyzingPath).isFile()) fs.rmSync(analyzingPath);
	});
	
	fs.rmdirSync(directoryPath);
}

class Source {
	static origin = path.join(__dirname, 'src');
	static target =  path.join(__dirname, 'dist');

	static files = fs.readdirSync(Source.origin);

	static TypeScriptOptions = {
		target: 'esnext',
		resolveJsonModule: true
	}

	static compile() {
		removeDirectory(Source.target);
		fs.mkdirSync(Source.target);

		for (let i = 0; i < Source.files.length; i++) {
			let name = Source.files[i].split('.')[0];
			let extension = '.' + Source.files[i].split('.')[1];

			let oldPath = path.join(Source.origin, name + extension);
			let newPath = path.join(Source.target, name);

			if (extension === '.ts') {
				let content = fs.readFileSync(oldPath, 'utf8');
				let result = TypeScript.transpile(content, Source.TypeScriptOptions);
				fs.writeFileSync(newPath + '.js', result);
			}

			else if (extension === '.scss') {
				let result = Sass.compile(oldPath).css;
				fs.writeFileSync(newPath + '.css', result);
			}

			else {
				let content = fs.readFileSync(oldPath, 'utf8');
				fs.writeFileSync(newPath + extension, content);
			}
		}
	}

	static bundle(indexFile) {
		const bundler = new Parcel(indexFile);
		bundler.bundle().then((result) => {
			console.log(result)
		});
	}
}

async function main() {
	let indexFile = path.join(Source.target, 'home.html');

	Source.compile();

	await Electron.app.whenReady();

	const window = new Electron.BrowserWindow({
		width: 800,
		height: 500,
		minWidth: 800,
		minHeight: 500,
		autoHideMenuBar: true
	});

	window.webContents.on('devtools-opened', window.webContents.closeDevTools);
	window.setFullScreenable(true);

	window.loadFile(indexFile);

	Electron.app.on('window-all-closed', () => {
		if (process.platform !== 'darwin') Electron.app.quit();
	})
}

main();