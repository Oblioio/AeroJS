window.Aero = window.Aero || {};
Aero.utils = Aero.utils || {};

// JSProgram registration
Aero.JSPrograms = Aero.JSPrograms || {};
Aero.registerJSProgram = function(id, obj){
    console.log('Aero.registerJSProgram: '+id);
    console.log('Aero.registerJSProgram2: '+id);
    // var currPrograms = Aero.JSPrograms;
    Aero.JSPrograms[id] = obj;
}