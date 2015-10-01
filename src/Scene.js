(function(window) {

    'use strict';

    var Scene = function (settingsJSON, parameters) {
        console.log('Scene');
        
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
        this.stepComplete = this.arrayExecuter.stepComplete.bind(this.arrayExecuter);
        
        if(parameters && parameters.canvas){
            this.canvas = parameters.canvas;
        } else {
            this.canvas = document.createElement('canvas');
        }
        this.onReady = (parameters && parameters.onReady)?parameters.onReady:null;
        
        this.nodes = {};

        var function_arr =  [
                { fn: dataReady, vars: settingsJSON },
                { fn: createTextures, vars: null },
                { fn: createJSPrograms, vars: null },
                { fn: createGLPrograms, vars: null },
                { fn: initRenderer, vars: null },
                { fn: ready, vars: null }
            ];
            
        if(typeof settingsJSON == "string"){
            this.dirPath = (settingsJSON.indexOf("/") >= 0)?settingsJSON.substring(0, settingsJSON.lastIndexOf("/")+1):"";
            function_arr.unshift({ fn: loadJSON, vars: settingsJSON });
        } else {
            this.data = settingsJSON;
            this.dirPath = "";
        }

        this.arrayExecuter.execute(function_arr);
    }

    function loadJSON(url){
        console.log('loadJSON');
        
        Aero.utils.XHRLoader(url, bind(JSONLoaded, this));
    }

    function JSONLoaded(data){
        console.log('JSONLoaded');
        data = JSON.parse(data);
        this.data = data;


        this.arrayExecuter.stepComplete();
    }
    
    function dataReady(){
        console.log('dataReady');
        var data = this.data;
        
        if(data["settings"]["dirPath"])this.dirPath = data["settings"]["dirPath"];
        
        //size the canvas
        // this.renderer.setSize(data["settings"]["dimensions"]["width"], data["settings"]["dimensions"]["height"]);
        
        // this.gl =  this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
        var preserveDrawingBuffer = (this.data["settings"]["preserveDrawingBuffer"] && String(this.data["settings"]["preserveDrawingBuffer"]).toLowerCase() == "true")?true:false;
        this.gl =  this.canvas.getContext("webgl", {preserveDrawingBuffer: preserveDrawingBuffer}) 
                || this.canvas.getContext("experimental-webgl", {preserveDrawingBuffer: preserveDrawingBuffer});

        this.renderer = new Aero.Renderer(this);
        
        // this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        // this.gl.clear();

        //setup GL parameters
        // this.maxTextureUnits = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        // this.nextTexUnit = 0;
        
        this.arrayExecuter.stepComplete();
    }

    function nodeIsTaken(id){
        console.log('ERROR: cannot have more than one node with id "'+id+'"');
    }

    function getNextTexUnit(){
        var texUnit = this.nextTexUnit;
        if(texUnit >= this.maxTextureUnits)
            console.log("ERROR: TexUnit "+texUnit+" | Only "+this.maxTextureUnits+" are supported.");
        this.nextTexUnit++;
        return texUnit;
    }

    function createTextures(){
        console.log('/////////////////  createTextures  /////////////////');
        var textureData = this.data["textures"],
            function_arr =  [];

        this.createTexture = createTexture.bind(this);

        this.textures = {};
        for(var t in textureData){
            if(this.nodes.hasOwnProperty(t)){
                nodeIsTaken(t);
                return;
            }

            var texObj = this.createTexture(textureData[t]);
            this.textures[t] = texObj;
            this.nodes[t] = texObj;
            texObj.id = t;

            function_arr.push({ fn: texObj.loadTexture, scope:texObj, vars: [this.stepComplete] });
        }

        this.arrayExecuter.execute(function_arr);
    }

    function createTexture(textureData){
        return new Aero.GLTexture({
            imgURL: textureData,
            texUnit: this.renderer.getNextTexUnit()
        }, this);
    }

    function createJSPrograms(){
        console.log('/////////////////  createJSPrograms  /////////////////');
        // var programData = this.data["jsPrograms"] || this.data["JSPrograms"],
        var programData = this.data["jsPrograms"] || this.data["JSPrograms"],
            function_arr =  [],
            scriptsAttached = [],
            dependencies = [];

        this.createNextJSProgram = createNextJSProgram.bind(this);

        //programs
        this.JSPrograms = {};
        for(var p in programData){
            if(this.nodes.hasOwnProperty(p)){
                nodeIsTaken(p);
                return;
            }

            // check dependencies
            var s, d, exists;
            if(programData[p].dependencies && programData[p].dependencies.length){
                for(s=0; s<programData[p].dependencies.length; s++ ){
                    exists = false;
                    programData[p].dependencies[s] = programData[p].dependencies[s].replace('~/', this.dirPath);
                    for(d=0; d<dependencies.length; d++)
                        if(programData[p].dependencies[s] == dependencies[d])
                            exists = true;
                    if(!exists){
                        dependencies.push(programData[p].dependencies[s]);
                        function_arr.push({ fn: add_script, vars: [programData[p].dependencies[s], this.stepComplete] });
                    }
                }
            }

            this.JSPrograms[p] = {data: programData[p], obj:false};

            function_arr.push({ fn: this.createNextJSProgram, vars: String(''+p) });
        }

        this.arrayExecuter.execute(function_arr);
    }

    // pulled from https://software.intel.com/en-us/blogs/2010/05/22/dynamically-load-javascript-with-load-completion-notification
    function add_script(scriptURL, onloadCB) {
      var scriptEl    = document.createElement("script");
      scriptEl.type   = "text/javascript";
      scriptEl.src    = scriptURL;

      var scriptLoaded = function() {
        console.log('add script: loaded')
        onloadCB(scriptURL);
      }

      if(typeof(scriptEl.addEventListener) != 'undefined') {
        /* The FF, Chrome, Safari, Opera way */
        scriptEl.addEventListener('load',scriptLoaded,false);
      }

      else {
        var handleIeState = function() {
          if(scriptEl.readyState == 'loaded'){
            scriptLoaded(scriptURL);
          }
        }
        var ret = scriptEl.attachEvent('onreadystatechange',handleIeState);
      }

      document.getElementsByTagName("head")[0].appendChild(scriptEl);
    }


    function createNextJSProgram(id){
        console.log('createNextJSProgram: '+id);

        if (!Aero.JSPrograms[this.JSPrograms[id].data.id]){
            // the JS Program has not been attached yet
            // window.requestAnimationFrame(bind(function(){
            //     this.createNextJSProgram(id);
            // }, this));
            console.log('There is no registered JSProgram with the id: '+this.JSPrograms[id].data.id);
            return
        } else {
            var progObj = new Aero.JSPrograms[this.JSPrograms[id].data.id](this.JSPrograms[id].data, this);
            this.JSPrograms[id] = progObj;
            this.nodes[id] = progObj;
            progObj.id = id;
            progObj.type = "JSProgram";
            progObj.dependents = []; //this will contain nodes that rely on this node to run first
            if(progObj.init){
                progObj.init(this.stepComplete);
            } else {
                this.arrayExecuter.stepComplete();
            }
            if(!progObj.run)progObj.run = function(){};
        }

    }

    function createGLPrograms(){
        console.log('/////////////////  createGLPrograms  /////////////////');
        var programData = this.data["glPrograms"] || this.data["GLPrograms"],
            function_arr =  [];

        //programs
        this.GLPrograms = {};
        for(var p in programData){
            if(this.nodes.hasOwnProperty(p)){
                nodeIsTaken(p);
                return;
            }
            var progObj = new Aero.GLProgram(programData[p], this);
            this.GLPrograms[p] = progObj;
            this.nodes[p] = progObj;
            progObj.id = p;
            progObj.dependents = []; //this will contain nodes that rely on this node to run first
            function_arr.push({ fn: progObj.init, scope:progObj, vars: [this.stepComplete] });
        }

        this.arrayExecuter.execute(function_arr);
    }
    
    function initRenderer(){
        this.renderer.init(this.stepComplete);
    }
    
    function ready(){
        // drawNodes.call(this);
        
        // call initial render
        if(this.data["settings"]["autoRender"])this.renderer.start();
        
        if(this.onReady)this.onReady();
    }
    
    // convenience functions
    
    Scene.prototype.render = function(){
        this.renderer.render();        
    }

    // Scene.prototype.getNextTexUnit = getNextTexUnit;
    // Scene.prototype.useStandardVertexBuffer = useStandardVertexBuffer;
    // Scene.prototype.useCustomVertexBuffer = useCustomVertexBuffer;
    // Scene.prototype.createCustomVertexBuffer = createCustomVertexBuffer;
    // Scene.prototype.updateCustomVertexBuffer = updateCustomVertexBuffer;



    // add section to Aero namespace
    Aero.Scene = Scene;

}(window));
