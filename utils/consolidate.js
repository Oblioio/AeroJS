var fs = require('fs'),
    jsStringEscape = require('js-string-escape'),
    jsonData, 
    nodes = [],
    dirPath,
    library;

fs.readFile(process.argv[2], function (err, data) {
    if (err) {
        throw err; 
    }
    // console.log(data.toString());
    jsonData = JSON.parse(data.toString());
    jsonData.library = jsonData.library || {};
    dirPath = (process.argv[2].indexOf("/") >= 0)?process.argv[2].substring(0, process.argv[2].lastIndexOf("/")+1):"";
        
    var item, i, d, filepath,
        jsPrograms = jsonData.jsPrograms || jsonData.JSPrograms
        glPrograms = jsonData.glPrograms || jsonData.GLPrograms;
    
    for(item in jsPrograms)nodes.push(jsPrograms[item]);
    for(item in glPrograms)nodes.push(glPrograms[item]);
    
    console.log(nodes);
    // console.log(jsonData.jsPrograms);
    // console.log(jsonData.glPrograms);

    for(i=0; i<nodes.length; i++){
        if(nodes[i].dependencies && nodes[i].dependencies.length){
            for(d=0; d<nodes[i].dependencies.length; d++){
                console.log('dependency: '+nodes[i].dependencies[d]);
                filepath = nodes[i].dependencies[d];
                if(!jsonData.library[filepath]) 
                    jsonData.library[filepath] = fs.readFileSync(String(filepath).replace('~/', dirPath)).toString();
            }
        }
        if(nodes[i].vertexShader && !jsonData.library[nodes[i].vertexShader])
            jsonData.library[nodes[i].vertexShader] = fs.readFileSync(String(nodes[i].vertexShader).replace('~/', dirPath)).toString();
        if(nodes[i].fragmentShader && !jsonData.library[nodes[i].fragmentShader])
            jsonData.library[nodes[i].fragmentShader] = fs.readFileSync(String(nodes[i].fragmentShader).replace('~/', dirPath)).toString();
    }
    
    fs.writeFile(String(process.argv[2]).replace('.json','_packed.json'), JSON.stringify(jsonData, null, '    '));
    
    // console.log(jsonData.library);
});





