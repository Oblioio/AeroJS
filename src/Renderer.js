(function(window) {

    'use strict';


    function Renderer(_scene){
        this.scene = _scene;
        this.gl = this.scene.gl;
    }
    
    function setSize(w, h){        
        //size the canvas
        this.scene.canvas.width = w;
        this.scene.canvas.height = h;
    }
    
    function init(){
        
        var function_arr =  [
                { fn: createRenderList, vars: null },
                { fn: createFrameBuffers, vars: null },
                { fn: initVertexBuffers, vars: null }
            ];
    }
    
    function start(){
        
    }
    
    function stop(){
        
    }
    
    function render(){
        
        var gl = this.gl,
            nodeObj,
            d;

        for(var p=0; p<this.renderList.length; p++){
            nodeObj = this.renderList[p];

            switch(nodeObj.type){
                case "GLProgram":
                    // console.log('program: '+nodeObj.id);
                    if(nodeObj.drawToCanvas){
                        // console.log(nodeObj.id+' draw to canvas!');
                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    } else {
                        // console.log('bind buffer: '+nodeObj.outputBuffer);
                        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[nodeObj.outputBuffer].frameBuffer);
                        if(nodeObj.clearBuffer)
                            gl.clear(gl.COLOR_BUFFER_BIT);
                    }

                    //attach program
                    gl.useProgram(nodeObj.program);
                    gl.program = nodeObj.program;

                    //update vertex attrib
                    if(!this.usingStandardVertexBuffer){
                        this.useStandardVertexBuffer(this);
                    }


                    //update uniforms
                    nodeObj.updateUniforms();

                    //draw
                    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); // Draw the rectangle

                    nodeObj.render();

                    break;
                case "JSProgram":;
                    if(nodeObj.draws){
                        if(!nodeObj.drawToCanvas){
                            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[nodeObj.outputBuffer].frameBuffer);
                            if(nodeObj.clearBuffer)
                                gl.clear(gl.COLOR_BUFFER_BIT);
                        } else {
                            // console.log(nodeObj.id+' draw to canvas!');
                            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        }
                    }
                    // run program
                    nodeObj.run();

                    // update dependents
                    d = nodeObj.dependents.length;
                    // if(d>0)console.log('update dependents');
                    while(d--){
                        // if(nodeObj.dependents[d].id="passthrough3")console.log(nodeObj.outputs[nodeObj.dependents[d].sourceVar]);
                        nodeObj.dependents[d].obj.inputs[nodeObj.dependents[d].destVar] = nodeObj.outputs[nodeObj.dependents[d].sourceVar];
                    }

                    break;
                case "texture":
                    break;
            }
        }

        window.requestAnimationFrame(bind(drawNodes, this));
    }
    
    Renderer.prototype.setSize = setSize;
    Renderer.prototype.render = render;
    
    // add section to Aero namespace
    Aero = Aero || {};
    Aero.Renderer = Renderer;

}(window));
