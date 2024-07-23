const getApiURL = require("../helper/getApiURL")

const convertToObject = async (eventId, formData, files, url) => {
    const apiURL = getApiURL(url)
    console.log(apiURL)
    const form = {}
    try {
        // console.log(formData)
        form["verifiableLink"] = formData.verifiableLink == "true"
        form["certiType"] = formData.certiType
        form["templateId"] = formData.templateId
        form["footer"] = { "footer": "" }
        form["footer"]["footer"] = formData["footer.footer"]
        form["body"] = { "body": formData["body.body"], 'fontSize': (formData["body.fontSize"] == "" ? 14 : parseInt(formData["body.fontSize"])), 'fontFamily': formData["body.fontFamily"], 'fontColor': formData["body.fontColor"], 'bold': formData["body.bold"], 'italic': formData["body.italic"], }
        form["certificateOf"] = { "certificateOf": formData["certificateOf.certificateOf"], 'fontSize': (formData["certificateOf.fontSize"] == "" ? 24 : parseInt(formData["certificateOf.fontSize"])), 'fontFamily': formData["certificateOf.fontFamily"], 'fontColor': formData["certificateOf.fontColor"], 'bold': formData["certificateOf.bold"], 'italic': formData["certificateOf.italic"], }
        form["header"] = []
        let i = 0
        while (formData[`header[${i}].header`] || formData[`header[${i}].header`] == "") {
            let Header = { "header": formData[`header[${i}].header`], 'fontSize': (formData[`header[${i}].fontSize`] == "" ? 18 : parseInt(formData[`header[${i}].fontSize`])), 'fontFamily': formData[`header[${i}].fontFamily`], 'fontColor': formData[`header[${i}].fontColor`], 'bold': formData[`header[${i}].bold`], 'italic': formData[`header[${i}].italic`], }
            form["header"].push(Header)
            i++;
        }
        i = 0
        form["title"] = []
        while (formData[`title[${i}].name`]) {
            let Title = { "name": formData[`title[${i}].name`], 'fontSize': (formData[`title[${i}].fontSize`] == "" ? 18 : parseInt(formData[`title[${i}].fontSize`])), 'fontFamily': formData[`title[${i}].fontFamily`], 'fontColor': formData[`title[${i}].fontColor`], 'bold': formData[`title[${i}].bold`], 'italic': formData[`title[${i}].italic`] }
            form["title"].push(Title)
            i++;
        }
        i = 0
        form["logos"] = []
        while (formData[`logos[${i}].url`] || formData[`logos[${i}].url`] == "") {
            let Logo = { "url": formData[`logos[${i}].url`], "height": (formData[`logos[${i}].height`] == "" ? 70 : formData[`logos[${i}].height`]), "width": (formData[`logos[${i}].width`] == "" ? 70 : formData[`logos[${i}].width`]) }
            form["logos"].push(Logo)
            i++;
        }
        i = 0
        form["signatures"] = []
        while (formData[`signatures[${i}].name.name`] || formData[`signatures[${i}].position.position`] || formData[`signatures[${i}].url.url`] || formData[`signatures[${i}].name.name`] == "" || formData[`signatures[${i}].position.position`] == "" || formData[`signatures[${i}].url.url`] == "") {
            let Signature = {
                "name": { "name": formData[`signatures[${i}].name.name`], "fontSize": (formData[`signatures[${i}].name.fontSize`] == "" ? 12 : formData[`signatures[${i}].name.fontSize`]), "fontFamily": formData[`signatures[${i}].name.fontFamily`], "bold": formData[`signatures[${i}].name.bold`], "italic": formData[`signatures[${i}].name.italic`], "fontColor": formData[`signatures[${i}].name.fontColor`] },
                "position": { "position": formData[`signatures[${i}].position.position`], "fontSize": (formData[`signatures[${i}].position.fontSize`] == "" ? 10 : formData[`signatures[${i}].position.fontSize`]), "fontFamily": formData[`signatures[${i}].position.fontFamily`], "bold": formData[`signatures[${i}].position.bold`], "italic": formData[`signatures[${i}].position.italic`], "fontColor": formData[`signatures[${i}].position.fontColor`] },
                "url": { "url": formData[`signatures[${i}].url.url`], "size": formData[`signatures[${i}].url.size`] == "" ? 100 : formData[`signatures[${i}].url.size`] },
            }
            form["signatures"].push(Signature)
            i++;
        }
        // console.log(form)
        let maxIndex = 0;
        form.signatures.forEach(elem => maxIndex++)
        files?.forEach(file => {
            const field = file.fieldname.split("[")[0]
            const index = parseInt(file.fieldname.split("[")[1].split("]")[0])
            if (index < maxIndex) {
                console.log(index, form["signatures"][index]["url"]["url"])
                if (field == "signatures") { form["signatures"][index]["url"]["url"] = `${apiURL}/certificatemodule/images/${file.path}`; }
                if (field == "logos") { form["logos"][index]["url"] = `${apiURL}/certificatemodule/images/${file.path}` }
            }
        });

        return form

    } catch (error) {
        console.log(error)
    }
}
module.exports = {
    convertToObject,
}