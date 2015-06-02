(function(window) {

    var XHRLoader = function (url, callback) {
        var xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {

            if ( xhr.readyState == 4 ) {

                if ( xhr.status == 200 || xhr.status == 0 ) {

                    try {

                        callback( xhr.responseText );

                    } catch ( error ) {

                        console.error( error );

                    }

                } else {

                    console.error( "Couldn't load [" + url + "] [" + xhr.status + "]" );

                }

            } 
        };
        
        xhr.open( "GET", url, true );
        xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
        xhr.setRequestHeader( "Content-Type", "text/plain" );
        xhr.send( null );
    }

    Aero.utils.XHRLoader = XHRLoader;
    
}(window));