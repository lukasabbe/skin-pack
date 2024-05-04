const fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require("fs");
var size_of = require('image-size')
var path = ""

async function main() {
    if(!fs.existsSync(`./whitelist.json`)){
        console.log("You have not added whitelist file");
        return;
    }
    let trusted_spelare = await fs.readFileSync('./whitelist.json','utf-8')
    trusted_spelare = JSON.parse(trusted_spelare);
    let banned_spelare = []
    if(fs.existsSync(`./bannedplayers.json`)){
        banned_spelare = await fs.readFileSync('./bannedplayers.json','utf-8')
        banned_spelare = JSON.parse(banned_spelare);
    }
    path = await make_pack()
    for(let i = 0; i < trusted_spelare.length; i++){
        let namn = trusted_spelare[i].name.toLowerCase();
        console.clear();
        console.log("Going thru all players in list, it will take a longer time because not being rate limited")
        console.log(`Current player: ${namn} - ${i}/${trusted_spelare.length}}`)
        if(banned_spelare.find(element => element.uuid == trusted_spelare[i].uuid) != undefined){
            console.log("This person is banned")
            await wait(500)
            continue;
        }
        let data = await getSkin(trusted_spelare[i].uuid, namn);
        let properties = "";
        if(data[0] == "slim")
            properties = `type=item\nmatchItems=minecraft:carved_pumpkin\nmodel=slim.json\ntexture=${data[1]}.png\nnbt.display.Name=ipattern:${data[1]}`
        else if(data[0] == "wierd")
            properties = `type=item\nmatchItems=minecraft:carved_pumpkin\nmodel=wierd_text.json\ntexture=${data[1]}.png\nnbt.display.Name=ipattern:${data[1]}`
        else
            properties = `type=item\nmatchItems=minecraft:carved_pumpkin\nmodel=normal.json\ntexture=${data[1]}.png\nnbt.display.Name=ipattern:${data[1]}`
        await fs.writeFileSync(`.${path}/player-${i}.properties`,properties)
        await wait(500)
    }
}

function getSkin(uuid, name){
    return new Promise((resolve, reject) =>{
        fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,{
            method: 'GET'
        }).then(async t =>{
            let json_data = await t.json();
            data = JSON.parse((Buffer.from(json_data.properties[0].value,"base64").toString('ascii')))
            let wierd = await saveSkin(data.textures.SKIN.url, data.profileName.toLowerCase())

            if(wierd == "wiredTexture")
                resolve(["wierd", data.profileName.toLowerCase()])

            else if(data.textures.SKIN.metadata == undefined){
                resolve(["normal", data.profileName.toLowerCase()])
            }
            else{
                resolve([data.textures.SKIN.metadata.model, data.profileName.toLowerCase()])
            }
        })
    })
}

function saveSkin(link,name){
    return new Promise((resolve, reject) =>{
        fetch(link,{
            method: 'GET'
        }).then(async t =>{
            let stream = t.body.pipe(fs.createWriteStream(`.${path}/${name}.png`))
            stream.on('finish', () => {
                size_of(`.${path}/${name}.png`, function (err, dim){
                    if(dim.height == 32){
                        resolve("wiredTexture")
                    }
                    else{
                        resolve("normal")
                    }
                })
            })
        })
    })
}

function wait(time){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, time);
    })
}


function make_pack(){
    return new Promise(async (resolve, reject) =>{
        await fs.mkdir("./skin-pack", (err) =>{});
        let pack_mcmeta = {
            "pack":{
                "pack_format":32,
                "description":"Skin pack\nMade by Lukasabbe"
            }
        }
        await fs.writeFileSync("./skin-pack/pack.mcmeta", JSON.stringify(pack_mcmeta));
        await fs.mkdir("./skin-pack/assets", (err) =>{});
        await fs.mkdir("./skin-pack/assets/minecraft", (err) =>{});
        await fs.mkdir("./skin-pack/assets/minecraft/optifine", (err) =>{});
        await fs.mkdir("./skin-pack/assets/minecraft/optifine/cit", (err) =>{});
        await fs.mkdir("./skin-pack/assets/minecraft/optifine/cit/skins", (err) =>{});
        await fs.copyFileSync("slim.json","./skin-pack/assets/minecraft/optifine/cit/skins/slim.json")
        await fs.copyFileSync("normal.json","./skin-pack/assets/minecraft/optifine/cit/skins/normal.json")
        await fs.copyFileSync("wierd_text.json","./skin-pack/assets/minecraft/optifine/cit/skins/wierd_text.json")
        resolve("/skin-pack/assets/minecraft/optifine/cit/skins")
    })
}

main();