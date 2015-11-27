(function(window) {

    'use strict';


    function IO(_scene){
        this.scene = _scene;
        this.arrayExecuter = new Aero.utils.ArrayExecuter(this);
        this.dependencies = [];
    }
    
    function loadData(settingsJSON, callBackFn){
        console.log('AERO: loadData');
        if(typeof settingsJSON == "string"){     
            // settingsJSON is external path   
            Aero.utils.XHRLoader(settingsJSON, function(data){                     
                this.scene.dirPath = (settingsJSON.indexOf("/") >= 0)?settingsJSON.substring(0, settingsJSON.lastIndexOf("/")+1):"";
                this.scene.data = JSON.parse(data);
                callBackFn();
            }.bind(this));
            
        } else {
            // settingsJSON is obj
            this.scene.dirPath = "";
            this.scene.data = settingsJSON;
            callBackFn();
        }
    }
    
    function buildData(jsonObj, callBackFn){
        console.log('AERO: buildData');
                
        var function_arr =  [
                { fn: createTextures, vars: [jsonObj["textures"]] },
                { fn: createJSPrograms, vars: [jsonObj["jsPrograms"] || jsonObj["JSPrograms"]] },
                { fn: createGLPrograms, vars: [jsonObj["glPrograms"] || jsonObj["GLPrograms"]] },
                { fn: createRenderTargets, vars: [jsonObj["renderTargets"] || jsonObj["Connections"]] },
                { fn: createConnections, vars: [jsonObj["connections"] || jsonObj["Connections"]] },
                { fn: callBackFn}
            ];
            
        this.arrayExecuter.execute(function_arr);
    }
    
    function createTextures(textureData, callBackFn){
        console.log('/////////////////  createTextures  /////////////////');
        var function_arr = [];
        
        for(var id in textureData){
            function_arr.push({fn: this.scene.createTexture, scope:this.scene, vars:[id, textureData[id]] });
        }
        if(!function_arr.length){
            callBackFn();
        } else {
            function_arr.push({fn: callBackFn });
            this.arrayExecuter.execute(function_arr);
        }
    }
    
    function createJSPrograms(programData, callBackFn){
        console.log('/////////////////  createJSPrograms  /////////////////');
        var function_arr = [];
        
        for(var id in programData){
            function_arr.push({fn: this.scene.createJSProgram, scope:this.scene, vars:[id, programData[id]] });
        }
        if(!function_arr.length){
            callBackFn();
        } else {
            function_arr.push({fn: callBackFn });
            this.arrayExecuter.execute(function_arr);
        }
    }
    
    // returns true if already loaded
    function checkDependency(_file){
        for(var d=0; d<this.dependencies.length; d++)
                if(_file == this.dependencies[d])
                    return true;
        return false;
    }
    
    function loadDependencies(_files, callBackFn){
        var function_arr = [],
            exists, s, d;
            
        for( s=0; s<_files.length; s++ ){
            if( !this.checkDependency(_files[s]) ){                
                this.dependencies.push(_files[s]);
                console.log(_files[s]);
                if(this.scene.data.library[_files[s]]){
                    write_script(this.scene.data.library[_files[s]]);
                } else {
                    function_arr.push({ fn: add_script, vars: [_files[s]] });
                }
            }
        }
        if(!function_arr.length){
            callBackFn();
        } else {
            function_arr.push({fn: callBackFn });
            this.arrayExecuter.execute(function_arr);
        }
    }
    
    function write_script(_script_){
        var scriptEl    = document.createElement("script");
        scriptEl.type   = "text/javascript";
        // scriptEl.src    = scriptURL.replace('~/', this.scene.dirPath);

        // console.log('add_script: '+scriptURL);
        
        scriptEl.innerHTML = _script_;
        
        document.getElementsByTagName("head")[0].appendChild(scriptEl);
    }
    
    // pulled from https://software.intel.com/en-us/blogs/2010/05/22/dynamically-load-javascript-with-load-completion-notification
    function add_script(scriptURL, onloadCB) {
      var scriptEl    = document.createElement("script");
      scriptEl.type   = "text/javascript";
      scriptEl.src    = scriptURL.replace('~/', this.scene.dirPath);
      
      console.log('add_script: '+scriptURL);
      
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
    
    function createGLPrograms(programData, callBackFn){
        console.log('/////////////////  createGLPrograms  /////////////////');
        var function_arr = [];
        
        for(var id in programData){
            function_arr.push({fn: this.scene.createGLProgram, scope:this.scene, vars:[id, programData[id]] });
        }
        if(!function_arr.length){
            callBackFn();
        } else {
            function_arr.push({fn: callBackFn });
            this.arrayExecuter.execute(function_arr);
        }
    }
    
    function createConnections(connectionData, callBackFn){
        for(var i=0; i<connectionData.length; i++){
            this.scene.createConnection(
                    connectionData[i].source.id,
                    connectionData[i].source.var || null,
                    connectionData[i].dest.id,
                    connectionData[i].dest.var || null,
                    connectionData[i].feedback || null
                );
        }
        if(callBackFn)callBackFn();
    }
    
    function createRenderTargets(targetData, callBackFn){
        // for(var i=0; i<targetData.length; i++){
        for(var i in targetData){
            this.scene.createRenderTarget(
                    i,
                    targetData[i].nodes || []
                );
        }
        if(callBackFn)callBackFn();        
    }
    
    function destroy(){        
        this.arrayExecuter.destroy();
        
        this.scene = null;
        this.arrayExecuter = null;
        this.dependencies = null;
    }
    
    IO.prototype.loadData = loadData;
    IO.prototype.checkDependency = checkDependency;
    IO.prototype.loadDependencies = loadDependencies;
    IO.prototype.buildData = buildData;
    
    IO.prototype.destroy = destroy;
    
    // add section to Aero namespace
    Aero = Aero || {};
    Aero.IO = IO;

}(window));
