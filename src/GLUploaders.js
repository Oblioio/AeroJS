(function(window) {
    
    'use strict';
    
    
    // add section to Aero namespace
    Aero = Aero || {};
    Aero.GLUploaders = {
        uniform1f: function(gl, u_loc, u_val){
            gl.uniform1f(u_loc, u_val);
        },
        uniform2f: function(gl, u_loc, u_val){
            gl.uniform2f(u_loc, u_val[0], u_val[1]);
        },
        uniform3f: function(gl, u_loc, u_val){
            gl.uniform3f(u_loc, u_val[0], u_val[1], u_val[2]);
        },
        uniform4f: function(gl, u_loc, u_val){
            gl.uniform4f(u_loc, u_val[0], u_val[1], u_val[2], u_val[3]);
        },
        uniform1i: function(gl, u_loc, u_val){
            gl.uniform1i(u_loc, u_val);
        },
        uniform2i: function(gl, u_loc, u_val){
            gl.uniform2i(u_loc, u_val);
        },
        uniform3i: function(gl, u_loc, u_val){
            gl.uniform3i(u_loc, u_val);
        },        
        uniform4i: function(gl, u_loc, u_val){
            gl.uniform3i(u_loc, u_val);
        },
        uniformMatrix2fv: function(gl, u_loc, u_val){
            gl.uniformMatrix2fv(u_loc, gl.FALSE, u_val);
        },
        uniformMatrix3fv: function(gl, u_loc, u_val){
            gl.uniformMatrix3fv(u_loc, gl.FALSE, u_val);
        },
        uniformMatrix4fv: function(gl, u_loc, u_val){
            gl.uniformMatrix4fv(u_loc, gl.FALSE, u_val);
        }
    }


}(window));
