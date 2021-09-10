$( document ).ready( function () {

  var parameters = ( function ( src ) {
    var params = {}, qryStr = src.split( '?' )[ 1 ];
    if( qryStr ) {
      $.each( qryStr.split( '&' ), function ( i, p ) {
        var ps = p.replace( /\/$/, '' ).split( '=' );
        var k = ps[ 0 ].replace( /^\?/, '' );
        params[ k ] = ps[ 1 ] || true;
      });
    }
    return params;
  })( location.search );

  var x = 0;
  var y = 0;

  var auto;
  var auto_x = 0;
  var auto_y = 0;
  var auto_throttle;

  // PARAMETER: *s* is the speed of the automatic timeout animation.
  var s = parameters.s || 3;

  // PARAMETER: *n* is the number of segments.
  var n = ~~parameters.n || 7;
  var tiles = '';
  if ( n ) {
    for ( var i = 0; i <= n * 2; i++ ) {
      tiles += [ '<div class="tile t', i, '"><div class="image"></div></div>' ].join( '' );
    }
  }
  let level = 0;
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(function(stream) {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
  
    analyser.smoothingTimeConstant = 0.5;
    analyser.fftSize = 1024;
  
    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);
    javascriptNode.onaudioprocess = function() {
        var array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var values = 0;
  
        var length = array.length;
        for (var i = 0; i < length; i++) {
          values += (array[i]);
        }
  
        var average = values / length;
        
        level = Math.round(average);
      
      // colorPids(average);
    }
    })
    .catch(function(err) {
      /* handle the error */
  });

  var $kaleidescope = $( '.kaleidoscope' )
    .addClass( 'n' + n )
    .append( tiles );

  var $image = $kaleidescope.find( '.image' );

  var $fullscreen = $( '#fullscreen' );
  var k = $kaleidescope[ 0 ];

  // PARAMETER: *src* is the URL for an alternate image.
  var src = parameters.src;
  if ( src ) {
    $image.css( 'background-image', [ 'url(', decodeURIComponent( src ), ')' ].join( '' ) );
  }

  // PARAMETER: *clean* hides the Github and fullscreen links.
  var clean = parameters.clean;
  if ( clean ) {
    $( 'body' ).addClass('clean');
  }

  // PARAMETER: *opacity* sets opacity (0.0 -> 1.0).
  var opacity = parseFloat( parameters.opacity );
  if ( opacity ) {
    $kaleidescope.css('opacity', 0).fadeTo( 3000, opacity );
  }


  // PARAMETER (undocumented): *mode* changes the animation style.
  var mode = ~~parameters.mode || 2;

  // Project changes in cursor (x, y) onto the image background position.
  $kaleidescope.mousemove( function ( e ) {
    x++;
    y++;

    var nx = e.pageX, ny = e.pageY;
    switch ( mode ) {
      case 1:
        nx = -x;
        ny = e.pageY;
        break;
      case 2:
        nx = e.pageX;
        ny = -y;
        break;
      case 3:
        nx = x;
        ny = e.pageY;
        break;
      case 4:
        nx = e.pageX;
        ny = y;
        break;
      case 5:
        nx = x;
        ny = y;
        break;
    }

    move( nx, ny );
    auto = auto_throttle = false;
  });
  
  // An alternate image can be supplied via Dragon Drop.
  if ( 'draggable' in document.createElement('b') && window.FileReader ) {
    k.ondragenter = k.ondragover = function( e ) {
      e.preventDefault();
    };
  
    k.ondrop = function( e ) {
      readFile( e.dataTransfer.files[0] );
      e.preventDefault();
    };
  }
  
  function readFile( file ) {
    var r = new FileReader();
    if ( !file.type.match('image\/.*') ) {
      return false;
    }
    
    r.onload = function( e ) {
      $image.css( 'background-image', [ 'url(', e.target.result, ')' ].join( '' ) );
    };
    
    r.readAsDataURL( file );
  } 

  // Request Fullscreen for maximum LSD effect
  $fullscreen.click( function() {
    if ( document.fullscreenEnabled || document.mozFullScreenEnabled || 
        document.webkitFullscreenEnabled ) {
      if ( k.requestFullscreen )       k.requestFullscreen();
      if ( k.mozRequestFullScreen )    k.mozRequestFullScreen();
      if ( k.webkitRequestFullscreen ) k.webkitRequestFullscreen();
    }
  });

  // Animate all the things!
  window.requestAnimFrame = ( function( window ) {
    var suffix = "equestAnimationFrame",
      rAF = [ "r", "webkitR", "mozR" ].filter( function( val ) {
        return val + suffix in window;
      })[ 0 ] + suffix;

    return window[ rAF ]  || function( callback ) {
      window.setTimeout( function() {
        callback( +new Date() );
      }, 1000 / 60 );
    };
  })( window );

  function animate() {
    var time = new Date().getTime() * [ '.0000', s ].join( '' );
    level =Math.round(level/10);
    if(level>1){
      auto_x += (level);
      auto_y += (level);
    }
    else{
      auto_x -= 1+level ;
      auto_y -= 1+level;
    }

    let h1 = document.getElementsByTagName('h1')[0];
    h1.innerHTML = Math.round(level);
    

    move( auto_x, auto_y );
    if ( auto ) requestAnimFrame( animate );
  }

  function move( x, y ) {
    $image.css( 'background-position', [ x + "px", y + "px" ].join( ' ' ) );
  }

  // Timer to check for inactivity
  (function timer() {
      setTimeout( function() {
        timer();
        if( auto && !auto_throttle ) {
          animate();
          auto_throttle = true;
        } else {
          auto = true;
        }
      }, 2000 );
  })();
});
