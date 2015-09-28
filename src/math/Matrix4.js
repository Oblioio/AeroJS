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
    	return multiply(matA, createRotateX(ang));
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
    	return multiply(matA, createRotateY(ang));
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
		var te = clone(matA);
		te[0] *= s; te[4] *= s; te[8] *= s;
		te[1] *= s; te[5] *= s; te[9] *= s;
		te[2] *= s; te[6] *= s; te[10] *= s;
		te[3] *= s; te[7] *= s; te[11] *= s;
		return te;
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
    	return multiply(matA, createTranslation(xOff, yOff, zOff));
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
        // return [
        //     matB[0]*matA[0]+matB[3]*matA[1]+matB[6]*matA[2], matB[0]*matA[3]+matB[3]*matA[4]+matB[6]*matA[5], matB[0]*matA[6]+matB[3]*matA[7]+matB[6]*matA[8],
        //     matB[1]*matA[0]+matB[4]*matA[1]+matB[7]*matA[2], matB[1]*matA[3]+matB[4]*matA[4]+matB[7]*matA[5], matB[1]*matA[6]+matB[4]*matA[7]+matB[7]*matA[8],
        //     matB[2]*matA[0]+matB[5]*matA[1]+matB[8]*matA[2], matB[2]*matA[3]+matB[5]*matA[4]+matB[8]*matA[5], matB[2]*matA[6]+matB[5]*matA[7]+matB[8]*matA[8]
        // ]

        var newMat = [],
        	numcol = 4,
        	newVal;
        	
        for(var c=0; c<numcol; c++){
            for(var r=0; r<numcol; r++){
                newVal = 0;
                for(var m=0; m<numcol; m++){
                    newVal += matA[r+(m*numcol)]*matB[(c*numcol)+m];
                }
                newMat.push(newVal);
            }
        }

        return newMat;
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
