const path = require('path')
const fs = require('fs')

const pathRu = path.resolve(__dirname, process.env.NODE_ENV_PATH_RU)
const pathEn = path.resolve(__dirname, process.env.NODE_ENV_PATH_EN)
let trigger = true

// если нет папки, то создает пустую папку
if (!fs.existsSync(pathEn)) {
    fs.mkdirSync(pathEn, { recursive: true });
}

// получаем список файлов из папки temporary-po (русская версия)
fs.readdir(pathRu, (err, files) => {
    if (err)
        console.log(err);
    else {
        const arrayFileName = []

        files.forEach(file => {
            arrayFileName.push(file)
        })

        // перебирает массив и вызывается на каждый файл
        arrayFileName.forEach(fileName => {
            getContent(fileName)
        })
    }
})

function getContent(fileName) {
    const pathRuPo = path.resolve(__dirname, `${pathRu}/${fileName}`)
    const pathEnPo = path.resolve(__dirname, `${pathEn}/${fileName}`)

    const resRuPo = contentPo(pathRuPo)
    const resEnPo = contentPo(pathEnPo)

    // получает контент из файла .po и возвращает массив объектов
    function contentPo(dir) {
        if (fs.existsSync(dir)) {
            let content = fs.readFileSync(dir, 'utf8')
            content = content.split('\n\n')
            if (content.length > 1) {
                return content
            } else {
                trigger = false
                return []
            }
        } else {
            trigger = false
            return []
        }
    }

    // сохраняем первый текст от Weblate, если папка пустая En, то записываем первый элемент русский
    let firstElemRuPo;

    if (trigger) {
        firstElemRuPo = resEnPo[0]
    } else {
        firstElemRuPo = `
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
    }

    addComment(resRuPo)
    if (trigger) {
        addComment(resEnPo)
    }

    // отформатированный .po файл для отображения на английской странице tssdk
    let currentTranslatePo = findCurrentElTranslate(resRuPo, resEnPo)
    currentTranslatePo = firstElemRuPo + '\n' + '\n' + toStr(currentTranslatePo)
    setFile(fileName, currentTranslatePo)
}

// добавляет перед каждым элементом comment-separator, если его нет
function addComment(array) {
    const testReg = /comment-separator/
    array.forEach((el, key) => {
        if (!testReg.test(el) && key !== 0) {
            array[key] = '#.\n#: comment-separator\n' + el
        }
    })
}

function findCurrentElTranslate(resRuPo, resEnPo){
    let tempData = [];

    resRuPo.forEach((el, key) => {
        if (key > 0) {
            generateContent(el, key, resEnPo, tempData)
        }
    })

    return tempData;
}

function generateContent(elRU, key, resEnPo, tempData) {
    const elementReplace = replaceStr(JSON.stringify(elRU))
    const findStrRu = elementReplace.slice(elementReplace.indexOf('msgctxt'), elementReplace.indexOf('msgstr'));
    let lengthEnMsgstr = null
    let findEnElem;
    for (let i=0; i < resEnPo.length; i++) {
        let r = replaceStr(JSON.stringify(resEnPo[i]))
        const textEnMsgstr = r.slice(r.indexOf('msgstr'), r.length)
        lengthEnMsgstr = textEnMsgstr.replace('msgstr', '').replace(/[^a-zа-яё]/gim, '').length
        if (r.indexOf(findStrRu) !== -1 && r.slice(r.indexOf('msgctxt'), r.indexOf('msgstr')) === findStrRu) {
            findEnElem = elRU.slice(0, elRU.indexOf('msgid')) + resEnPo[i].slice(resEnPo[i].indexOf('msgid'))
            break;
        } else {
            findEnElem = false
        }
    }

    // если текст (enElem === true) совпадает, то записывается En версия, если не совпадает, то записывает Ru версию
    if (elRU.indexOf('msgid') !== -1 && lengthEnMsgstr > 1 && findEnElem) {
        if (Boolean(findEnElem)) {
            tempData.push(findEnElem)
        } else {
            tempData.push(elRU)
        }
    } else {
        // если строка msgstr-En пуста, то записываем на это место из msgid-Ru
        const textRuMsgid = elRU.slice(elRU.indexOf('msgid'), elRU.indexOf('msgstr') - 1)
            .replace(/msgid/g, 'msgstr')
        const contentRu = elRU.slice(0, elRU.indexOf('msgstr'))
        tempData.push(contentRu + textRuMsgid)
    }
}

// очищает от лишних символов для сравнения Ru/En
function replaceStr(str) {
    return str.replace(/\\n/gim, '').replace(/\s/gm, '').replace(/\\/gm, '').replace(/"/gm, '')
}

function setFile(fileName, newContentFile) {
    fs.writeFile(`${pathEn}/${fileName}`, newContentFile, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log(`Запись файла завершена. Содержимое файла находится: ${pathEn}/${fileName}`);
        }
    })
}

function toStr(e) {
    return e.join('\n\n').toString()
}
