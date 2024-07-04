const {removeImageBackground} = require("../helper/removebg")


const convertToObject = async (eventId, formData, files) => {
    const form = {}
    try {
        // console.log(formData)
        form["verifiableLink"] = formData.verifiableLink == "true"
        form["certiType"] = formData.certiType
        form["templateId"] = formData.templateId
        form["footer"] = { "footer": "" }
        form["footer"]["footer"] = formData["footer.footer"]
        form["body"] = { "body": formData["body.body"], 'fontSize': (formData["body.fontSize"] == "" ? 14 : parseInt(formData["body.fontSize"])), 'fontFamily': formData["body.fontFamily"], 'fontColor': formData["body.fontColor"], 'bold': formData["body.bold"], }
        form["certificateof"] = { "certificateOf": formData["certificateOf.certificateOf"], 'fontSize': (formData["certificateOf.fontSize"] == "" ? 24 : parseInt(formData["certificateOf.fontSize"])), 'fontFamily': formData["certificateOf.fontFamily"], 'fontColor': formData["certificateOf.fontColor"], 'bold': formData["certificateOf.bold"], }
        form["header"] = []
        let i = 0
        while (formData[`header[${i}].header`]) {
            let Header = { "header": formData[`header[${i}].header`], 'fontSize': (formData[`header[${i}].fontSize`] == "" ? 18 : parseInt(formData[`header[${i}].fontSize`])), 'fontFamily': formData[`header[${i}].fontFamily`], 'fontColor': formData[`header[${i}].fontColor`], 'bold': formData[`header[${i}].bold`], }
            form["header"].push(Header)
            i++;
        }
        i = 0
        form["title"] = []
        while (formData[`title[${i}].name`]) {
            let Title = { "name": formData[`title[${i}].name`], 'fontSize': (formData[`title[${i}].fontSize`] == "" ? 18 : parseInt(formData[`title[${i}].fontSize`])), 'fontFamily': formData[`title[${i}].fontFamily`], 'fontColor': formData[`title[${i}].fontColor`], 'bold': formData[`title[${i}].bold`], }
            form["title"].push(Title)
            i++;
        }
        i = 0
        form["logos"] = []
        while (formData[`logos[${i}].url`]) {
            let Logo = { "url": formData[`logos[${i}].url`], "height": (formData[`logos[${i}].height`] == "" ? 70 : formData[`logos[${i}].height`]), "width": (formData[`logos[${i}].width`] == "" ? 70 : formData[`logos[${i}].width`]) }
            form["logos"].push(Logo)
            i++;
        }
        i = 0
        form["signatures"] = []
        while (formData[`signatures[${i}].name.name`]) {
            let Signature = {
                "name": { "name": formData[`signatures[${i}].name.name`], "fontSize": (formData[`signatures[${i}].name.fontSize`] == "" ? formData[`signatures[${i}].name.fontSize`] : 12), "fontFamily": formData[`signatures[${i}].name.fontFamily`], "bold": formData[`signatures[${i}].name.bold`], "italic": formData[`signatures[${i}].name.italic`], "fontColor": formData[`signatures[${i}].name.fontColor`] },
                "position": { "position": formData[`signatures[${i}].position.position`], "fontSize": (formData[`signatures[${i}].position.fontSize`] == "" ? formData[`signatures[${i}].position.fontSize`] : 10), "fontFamily": formData[`signatures[${i}].position.fontFamily`], "bold": formData[`signatures[${i}].position.bold`], "italic": formData[`signatures[${i}].position.italic`], "fontColor": formData[`signatures[${i}].position.fontColor`] },
                "url": { "url": formData[`signatures[${i}].url.url`], "size": formData[`signatures[${i}].url.size`] == "" ? 100 : formData[`signatures[${i}].url.size`] },
            }
            form["signatures"].push(Signature)
            i++;
        }

        files?.forEach(file => {
            const field = file.fieldname.split("[")[0]
            const index = parseInt(file.fieldname.split("[")[1].split("]")[0])
            if (field == "signatures") { form["signatures"][index]["url"]["url"] = file.path }
            if (field == "logos") { form["logos"][index]["url"] = file.path }
        });

        for (let index = 0; index < form.signatures.length; index++) {
            console.log("starting")
            const imageDataURL = await removeImageBackground(form.signatures[index].url.url,eventId,"signatures",index)
            console.log("ending")
            form.signatures[index].url.url=imageDataURL
        }
        return form

    } catch (error) {
        console.log(error)
    }
}
module.exports = {
    convertToObject,
}