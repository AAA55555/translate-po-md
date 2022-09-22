//преобразует файл md в po

const path = require('path')
const fs = require('fs')

const pathRu = path.resolve(__dirname, '../i18n/temporary-po/src/dts/')
const pathDirRu = '../i18n/articles/'

if (!fs.existsSync(pathRu)) {
    fs.mkdirSync(pathRu, {recursive: true});
}

// получаем список файлов из папки articles (русская версия)
fs.readdir(path.resolve(__dirname, pathDirRu), (err, files) => {
    if (err)
        console.log(err);
    else {
        const arrayFileName = []

        files.forEach(file => {
            if (file.indexOf('.md') !== -1) {
                arrayFileName.push(file)
            }
        })

        arrayFileName.forEach((fileName) => {
            const dirRu = path.resolve(__dirname, `${pathDirRu}${fileName}`)
            generatePoContent(getContentMd(dirRu), fileName.slice(0, -2))
        })
    }
})

// генерирует po файл с комментариями и тд
function generatePoContent(contentMd, fileName) {
    let tempPo = []
    const textMsgctxt = [`\nmsgctxt "i18n/articles/${fileName}po 1 null shortText\\n"`]
    const tempMsgid = []
    const tempMsgstr = []
    const firstElemRuPo = `
msgid ""
msgstr ""
"Project-Id-Version: PACKAGE VERSION"
"Report-Msgid-Bugs-To: "
"POT-Creation-Date: 2021-05-06 16:28+0300"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>"
"Language-Team: LANGUAGE <LL@li.org>"
"MIME-Version: 1.0"
"Content-Type: text/plain; charset=UTF-8"
"Content-Transfer-Encoding: 8bit"
"X-Accelerator-Marker: &"
"X-Generator: Translate Toolkit 3.3.0"`
    tempPo.push(firstElemRuPo)

    contentMd.forEach((el) => {
        if (el.length > 0 && el.trim().length > 0) {
            tempMsgid.push(splitElement(el))
            tempMsgstr.push(splitElement(el))
        }
    })

    tempPo = [
        ...tempPo,
        ...textMsgctxt,
        'msgid ',
        ...tempMsgid.map(el => el + '\n' + '"\\n"'),
        'msgstr ',
        ...tempMsgstr.map(el => el + '\n' + '"\\n"'),
    ]
    setFile(fileName, tempPo.join('\n'))
}

// получает контент из файла .md и возвращает массив объектов
function getContentMd(dir) {
    const content = fs.readFileSync(dir, 'utf8')
    return content.split('\n\n')
}

// форматирует строки под синтаксис po
function splitElement(el) {
    const tempEl = []

    el = el.replace(/\r\n\r\n/gim, '\n\n').replace(/\r\n/gim, '\n')
    el.split('\n').forEach((item) => {
        item = item.replace(/"/gim, '\'')
        if (item.length > 0) {
            tempEl.push(`"${item.trimEnd()}\\n"`)
        }
    })
    return tempEl.join('\n')
}

// записывает в папку po файлы
function setFile(fileName, newContentFile) {
    fs.writeFile(`${pathRu}/articles-${fileName}po`, newContentFile, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log(`Markdown -> Po - Articles. Содержимое файла находится: i18n/temporary-po/src/dts/${fileName}po`);
        }
    })
}
