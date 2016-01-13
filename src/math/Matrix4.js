(function(window) {

    'use strict';
        
    function createRotateX(ang){
        return [
            1,              0,                0,               0,
            0,              Math.cos(ang),    Math.sin(ang),   0,
            0,              -Math.sin(ang),   Math.cos(ang),   0,
            0,              0,                0,               1
        ];
    }
    
    function rotateX(matA, ang){
        var _cos = Math.cos(ang),
            _sin = Math.sin(ang);
        
        return [
                matA[0], 
                matA[1], 
                matA[2], 
                matA[3],                
                matA[4]*_cos + matA[8]*_sin,
                matA[5]*_cos + matA[9]*_sin,
                matA[6]*_cos + matA[10]*_sin,
                matA[7]*_cos + matA[11]*_sin,                
                matA[4]*-_sin + matA[8]*_cos,
                matA[5]*-_sin + matA[9]*_cos,
                matA[6]*-_sin + matA[10]*_cos,
                matA[7]*-_sin + matA[11]*_cos,                
                matA[12],
                matA[13],
                matA[14],
                matA[15]
            ];        
    }
    
    function createRotateY(ang){
        return [
            Math.cos(ang),  0,    -Math.sin(ang),  0,
            0,              1,    0,               0,
            Math.sin(ang),  0,    Math.cos(ang),   0,
            0,              0,    0,               1
        ];        
    }
    
    function rotateY(matA, ang){        
        var _cos = Math.cos(ang),
            _sin = Math.sin(ang);
        
        return [
                matA[0]*_cos + matA[8]*-_sin, 
                matA[1]*_cos + matA[9]*-_sin,
                matA[2]*_cos + matA[10]*-_sin,
                matA[3]*_cos + matA[11]*-_sin,              
                matA[4],
                matA[5],
                matA[6],
                matA[7],
                matA[0]*_sin + matA[8]*_cos,            
                matA[1]*_sin + matA[9]*_cos,
                matA[2]*_sin + matA[10]*_cos,
                matA[3]*_sin + matA[11]*_cos,
                matA[12],
                matA[13],
                matA[14],
                matA[15]
            ];
    }
    
    function createRotateZ(ang){            
        return [
            Math.cos(ang),  Math.sin(ang),  0,  0,
            -Math.sin(ang), Math.cos(ang),  0,  0,
            0,              0,              1,  0,
            0,              0,              0,  1
        ];
    }
    
    function rotateZ(matA, ang){   
        var _cos = Math.cos(ang),
            _sin = Math.sin(ang);
        
        return [
                matA[0]*_cos+matA[4]*_sin, 
                matA[1]*_cos+matA[5]*_sin,
                matA[2]*_cos+matA[6]*_sin,
                matA[3]*_cos+matA[7]*_sin,
                matA[0]*-_sin+matA[4]*_cos,
                matA[1]*-_sin+matA[5]*_cos,
                matA[2]*-_sin+matA[6]*_cos,
                matA[3]*-_sin+matA[7]*_cos,
                matA[8],
                matA[9],
                matA[10],
                matA[11],
                matA[12],
                matA[13],
                matA[14],
                matA[15]
            ];        
    }

    function createScale(scale){
        return [
            scale, 0, 0, 0,
            0, scale, 0, 0,
            0, 0, scale, 0,
            0, 0, 0,     1
        ]
    }

    function scale (matA, s) {  
        return [
            matA[0]*s, matA[1]*s, matA[2]*s, matA[3]*s,
            matA[4]*s, matA[5]*s, matA[6]*s, matA[7]*s,
            matA[8]*s, matA[9]*s, matA[10]*s, matA[11]*s,
            matA[12], matA[13], matA[14], matA[15]
        ]
    }

    function createTranslation(xOff, yOff, zOff){
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            xOff, yOff, zOff, 1
        ]
    }
    
    function translate(matA, xOff, yOff, zOff){        
        return [
                matA[0], 
                matA[1], 
                matA[2],
                matA[3],           
                matA[4],
                matA[5],
                matA[6],
                matA[7],
                matA[8],
                matA[9],
                matA[10],
                matA[11],
                matA[0]*xOff+matA[4]*yOff+matA[8]*zOff+matA[12],
                matA[1]*xOff+matA[5]*yOff+matA[9]*zOff+matA[13],
                matA[2]*xOff+matA[6]*yOff+matA[10]*zOff+matA[14],
                matA[3]*xOff+matA[7]*yOff+matA[11]*zOff+matA[15]
            ];
    }

    function createProjection(near, far, fov, aspect){
        var top = near * Math.tan( fov * 0.5 ),
			bottom = - top,
			left = bottom * aspect,
			right = top * aspect,
			x = 2 * near / ( right - left ),
			y = 2 * near / ( top - bottom ),
			a = ( right + left ) / ( right - left ),
			b = ( top + bottom ) / ( top - bottom ),
			c = - ( far + near ) / ( far - near ),
			d = - 2 * far * near / ( far - near );

		var te = [];
		
		te[0] = x;	te[4] = 0;	te[8] = a;	    te[12] = 0;
		te[1] = 0;	te[5] = y;	te[9] = b;	    te[13] = 0;
		te[2] = 0;	te[6] = 0;	te[10] = c;	    te[14] = d;
		te[3] = 0;	te[7] = 0;	te[11] = - 1;	te[15] = 0;
		
		return te;
	}    

    function multiply (matA, matB){
        return [
                matA[0]*matB[0]+matA[4]*matB[1]+matA[8]*matB[2]+matA[12]*matB[3], 
                matA[1]*matB[0]+matA[5]*matB[1]+matA[9]*matB[2]+matA[13]*matB[3],
                matA[2]*matB[0]+matA[6]*matB[1]+matA[10]*matB[2]+matA[14]*matB[3],
                matA[3]*matB[0]+matA[7]*matB[1]+matA[11]*matB[2]+matA[15]*matB[3],
                matA[0]*matB[4]+matA[4]*matB[5]+matA[8]*matB[6]+matA[12]*matB[7],
                matA[1]*matB[4]+matA[5]*matB[5]+matA[9]*matB[6]+matA[13]*matB[7],
                matA[2]*matB[4]+matA[6]*matB[5]+matA[10]*matB[6]+matA[14]*matB[7],
                matA[3]*matB[4]+matA[7]*matB[5]+matA[11]*matB[6]+matA[15]*matB[7],
                matA[0]*matB[8]+matA[4]*matB[9]+matA[8]*matB[10]+matA[12]*matB[11],            
                matA[1]*matB[8]+matA[5]*matB[9]+matA[9]*matB[10]+matA[13]*matB[11],
                matA[2]*matB[8]+matA[6]*matB[9]+matA[10]*matB[10]+matA[14]*matB[11],
                matA[3]*matB[8]+matA[7]*matB[9]+matA[11]*matB[10]+matA[15]*matB[11],
                matA[0]*matB[12]+matA[4]*matB[13]+matA[8]*matB[14]+matA[12]*matB[15],
                matA[1]*matB[12]+matA[5]*matB[13]+matA[9]*matB[14]+matA[13]*matB[15],
                matA[2]*matB[12]+matA[6]*matB[13]+matA[10]*matB[14]+matA[14]*matB[15],
                matA[3]*matB[12]+matA[7]*matB[13]+matA[11]*matB[14]+matA[15]*matB[15]
            ];
    }

    function transpose(matA){
        return [
            matA[0], matA[4], matA[8], matA[12],
            matA[1], matA[5], matA[9], matA[13],
            matA[2], matA[6], matA[10], matA[14],
            matA[3], matA[7], matA[11], matA[15]
        ]
    }

    function inverse ( matA ) {
        // modded from THREE.js
		// based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
		var te = [],
        	n11 = matA[0], n12 = matA[4], n13 = matA[8], n14 = matA[12],
        	n21 = matA[1], n22 = matA[5], n23 = matA[9], n24 = matA[13],
        	n31 = matA[2], n32 = matA[6], n33 = matA[10], n34 = matA[14],
        	n41 = matA[3], n42 = matA[7], n43 = matA[11], n44 = matA[15];

		te[0] = n23*n34*n42 - n24*n33*n42 + n24*n32*n43 - n22*n34*n43 - n23*n32*n44 + n22*n33*n44;
		te[4] = n14*n33*n42 - n13*n34*n42 - n14*n32*n43 + n12*n34*n43 + n13*n32*n44 - n12*n33*n44;
		te[8] = n13*n24*n42 - n14*n23*n42 + n14*n22*n43 - n12*n24*n43 - n13*n22*n44 + n12*n23*n44;
		te[12] = n14*n23*n32 - n13*n24*n32 - n14*n22*n33 + n12*n24*n33 + n13*n22*n34 - n12*n23*n34;
		te[1] = n24*n33*n41 - n23*n34*n41 - n24*n31*n43 + n21*n34*n43 + n23*n31*n44 - n21*n33*n44;
		te[5] = n13*n34*n41 - n14*n33*n41 + n14*n31*n43 - n11*n34*n43 - n13*n31*n44 + n11*n33*n44;
		te[9] = n14*n23*n41 - n13*n24*n41 - n14*n21*n43 + n11*n24*n43 + n13*n21*n44 - n11*n23*n44;
		te[13] = n13*n24*n31 - n14*n23*n31 + n14*n21*n33 - n11*n24*n33 - n13*n21*n34 + n11*n23*n34;
		te[2] = n22*n34*n41 - n24*n32*n41 + n24*n31*n42 - n21*n34*n42 - n22*n31*n44 + n21*n32*n44;
		te[6] = n14*n32*n41 - n12*n34*n41 - n14*n31*n42 + n11*n34*n42 + n12*n31*n44 - n11*n32*n44;
		te[10] = n12*n24*n41 - n14*n22*n41 + n14*n21*n42 - n11*n24*n42 - n12*n21*n44 + n11*n22*n44;
		te[14] = n14*n22*n31 - n12*n24*n31 - n14*n21*n32 + n11*n24*n32 + n12*n21*n34 - n11*n22*n34;
		te[3] = n23*n32*n41 - n22*n33*n41 - n23*n31*n42 + n21*n33*n42 + n22*n31*n43 - n21*n32*n43;
		te[7] = n12*n33*n41 - n13*n32*n41 + n13*n31*n42 - n11*n33*n42 - n12*n31*n43 + n11*n32*n43;
		te[11] = n13*n22*n41 - n12*n23*n41 - n13*n21*n42 + n11*n23*n42 + n12*n21*n43 - n11*n22*n43;
		te[15] = n12*n23*n31 - n13*n22*n31 + n13*n21*n32 - n11*n23*n32 - n12*n21*n33 + n11*n22*n33;

		var det = n11 * te[ 0 ] + n21 * te[ 4 ] + n31 * te[ 8 ] + n41 * te[ 12 ];

		if ( det == 0 ) {
			return [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
		}

        te = scale(te, 1 / det );

		return te;

	}

    function clone(matA){
        return [
            matA[0], matA[1], matA[2], matA[3],
            matA[4], matA[5], matA[6], matA[7],
            matA[8], matA[9], matA[10], matA[11],
            matA[12], matA[13], matA[14], matA[15]
        ]
    }
    
    // add section to Aero namespace
    Aero.Math = Aero.Math || {};
    Aero.Math.Matrix4 = {
    	"createRotateX": createRotateX,
    	"rotateX": rotateX,
        "createRotateY": createRotateY,
        "rotateY": rotateY,
        "createRotateZ": createRotateZ,
        "rotateZ": rotateZ,
    	"createScale": createScale,
    	"scale": scale,
    	"createTranslation": createTranslation,
    	"translate": translate,
    	"createProjection": createProjection,
    	"multiply": multiply,
    	"transpose": transpose,
    	"inverse": inverse,
    	"clone": clone
    };


}(window));
