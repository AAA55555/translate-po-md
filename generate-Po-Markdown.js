//преобразует файл po в md
const path = require('path')
const fs = require('fs')
let { COPYFILE_EXCL } = fs.constants;

const pathEn = path.resolve(__dirname, '../i18n/typedoc-json-exports/en/src/dts/')

checkDir('../i18n/articles_en/')

// получаем список файлов из папки articles (en версия)
fs.readdir(pathEn, (err, files) => {
    if (err)
        console.log(err);
    else {
        const arrayFileName = []

        files.forEach(file => {
            if (file.indexOf('.po') !== -1 && file.indexOf('articles-') !== -1) {
                arrayFileName.push(file)
            }
        })

        arrayFileName.forEach(fileName => {
            const dirRu = (`${pathEn}/${fileName}`)
            generateMdContent(getContentPo(dirRu), fileName.slice(0, -2))
        })
    }
})

// получает контент из файла .po и возвращает массив объектов
function getContentPo(dir) {
    const content = fs.readFileSync(dir, 'utf8')
    return content.split('\n\n')
}

// генерирует md файл
function generateMdContent(contentPo, fileName) {
    let tempArray = []
    contentPo.forEach((el, key) => {
        if (el.length > 0 && key > 0) {
            let textEn = el.slice(el.indexOf('msgstr'), el.length - 1).replace('msgstr ', '').split('"\\n"')
            let elReplace = JSON.parse(JSON.stringify(textEn).replace(/\\\\n\\"\\n\\"/gm, 'replace').replace(/\\"\\n\\"/gm, '').replace(/replace/gm, '\\n'))
            elReplace = elReplace.join('').replace(/\\n/gm, '').replace(/^"/gm, '').replace(/"$/gm, '')
            if (elReplace.length > 1) {
                tempArray.push(elReplace)
            }
        }
    })
    tempArray = tempArray.join('\n\n').toString()
    setFile(fileName, tempArray)
}

// записывает в папку po файлы
function setFile(fileName, newContentFile) {
    fs.writeFile( path.resolve(__dirname, `../i18n/articles_en/${fileName.replace('articles-', '')}md`), newContentFile, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log(`Po -> Markdown - Articles. Содержимое файла находится: i18n/articles_en/${fileName}md`);
        }
    })
    removeFile(`${pathEn}/${fileName}po`, fileName)
}

function removeFile(pathFile, fileName) {
    if (fs.existsSync(pathFile)) {
        fs.unlink(pathFile, err => {
            if(err) throw err; // не удалось удалить файл
        });
    }
}


function checkDir(pathDir) {
    if (!fs.existsSync(path.resolve(__dirname, pathDir))) {
        fs.mkdirSync(path.resolve(__dirname, pathDir), { recursive: true });
    }
}

// переносит файлы (без замены) из папки i18n/articles/assets/ru в i18n/articles/assets/en

const dirAssets = path.resolve(__dirname, '../i18n/articles/assets/')
fs.readdir(dirAssets, (err, elements) => {
    if (err)
        console.log(err);
    else {
        rec(elements)
    }
})

function rec(elements) {
    for (let i = 0; i < elements.length; i++) {
        let pathDirEn = path.resolve(__dirname, `../i18n/articles_en/assets/${elements[i]}`)
        let pathDirRu = path.resolve(__dirname, `../i18n/articles/assets/${elements[i]}`)
        checkDir(pathDirEn)

        recurse(pathDirRu, pathDirEn)
        function recurse(pathRu, pathEn) {
            const listFiles = getListFiles(pathRu)
            if (listFiles !== 'file') {
                for (let j = 0; j < listFiles.length; j++) {
                    let tempPathRu = `${pathRu}/${listFiles[j]}`
                    let tempPathEn = `${pathEn}/${listFiles[j]}`
                    let res = getListFiles(tempPathRu)
                    if (res === 'file') {
                        copyFile(tempPathRu, tempPathEn)
                    } else {
                        checkDir(tempPathEn)
                        recurse(tempPathRu, tempPathEn)
                    }
                }
            } else {
                let tempPathRu = `${pathRu}/${listFiles}`
                let tempPathEn = `${pathEn}/${listFiles}`
                copyFile(tempPathRu, tempPathEn)
            }
        }
    }
}

function getListFiles(elemPath) {
    try {
        return fs.readdirSync(elemPath);
    } catch (e) {
        return 'file';
    }
}

function copyFile(pathRu, pathEn) {
    fs.copyFile(pathRu, pathEn, COPYFILE_EXCL,err => {
        if(err) {
            console.log('Не удалось скопировать файл. Файл существует: ' + pathEn);
            return;
        }
        console.log('Файл успешно скопирован: ' + pathEn);
    });
}
