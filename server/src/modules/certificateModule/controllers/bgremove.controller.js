

const removeBG = async (eventId,body) =>{
    const form = body
    for (let index = 0; index < form.signatures.length; index++) {
        console.log(form.signatures[index].url.url)
        const imageDataURL= await removeImageBackground(form.signatures[index].url.url)}
    return form
}

module.exports = {removeBG}