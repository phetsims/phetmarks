
console.log( 'loaded' );

function whiteSplit( str ) {
  return str.split( '\n' ).map( function( line ) {
    return line.replace( '\r', '' );
  } ).filter( function( line ) {
    return line.length > 0;
  } );
}

var choiceData = {};

function populate( activeRunnables, activeRepos, activeSims ) {
  activeRepos.forEach( function( repo ) {
    var choices = choiceData[ repo ] = [];

    if ( _.contains( activeRunnables, repo ) ) {
      choices.push( {
        name: 'requirejs',
        text: 'Require.js',
        url: '../../' + repo + '/' + repo + '_en.html?ea&brand=phet',
        queryParameters: [ 'ea', 'brand=phet' ] // TODO: how to determine query parameters
      } );
      choices.push( {
        name: 'compiled',
        text: 'Compiled',
        url: '../../' + repo + '/build/' + repo + '_en.html'
      } );
    }

    // phet-io wrappers
    if ( _.contains( [ 'beers-law-lab', 'bending-light', 'build-an-atom', 'charges-and-fields', 'color-vision', 'concentration', 'faradays-law', 'molecules-and-light' ], repo ) ) {
      // TODO: this is a query parameter?
      choices.push( {
        name: 'console-output',
        text: 'Formatted Console Output',
        url: '../../' + repo + '/' + repo + '_en.html?ea&brand=phet-io&phet-io.standalone&phet-io.log=lines'
      } );
      [
        'active',
        'audio',
        'classroom-activity',
        'wrapper-template',
        'index',
        'lab-book',
        'event-log',
        'instance-proxies',
        'mirror-inputs',
        'playback',
        'record',
        'screenshot',
        'state'
      ].forEach( function( wrapper ) {
        choices.push( {
          name: wrapper,
          text: wrapper,
          url: '../../phet-io/wrappers/' + wrapper + '/' + wrapper + '.html?sim=' + repo
        } );
      } );
    }

    if ( repo === 'axon' || repo === 'phet-core' || repo === 'dot' || repo === 'kite' || repo === 'scenery' ) {
      choices.push( {
        name: 'unitTestsRequirejs',
        text: 'Unit Tests (Require.js)',
        url: '../../' + repo + '/tests/qunit/unit-tests.html'
      } );
      choices.push( {
        name: 'unitTestsCompiled',
        text: 'Unit Tests (Compiled)',
        url: '../../' + repo + '/tests/qunit/compiled-unit-tests.html'
      } );
    }

    choices.push( {
      name: 'github',
      text: 'GitHub',
      url: 'https://github.com/phetsims/' + repo
    } );
    choices.push( {
      name: 'issues',
      text: 'Issues',
      url: 'https://github.com/phetsims/' + repo + '/issues'
    } );
  } );
}

var PADDING = 2;

function render( activeRunnables, activeRepos, activeSims ) {
  var repoSelect = document.createElement( 'select' );

  activeRepos.forEach( function( repo ) {
    var repoOption = document.createElement( 'option' );
    repoOption.value = repo;
    repoOption.label = repo;
    repoSelect.appendChild( repoOption );
  } );
  repoSelect.setAttribute( 'size', activeRepos.length );
  if ( localStorage.getItem( 'testmarks-repo' ) ) {
    repoSelect.value = localStorage.getItem( 'testmarks-repo' );
  }

  document.body.appendChild( repoSelect );

  repoSelect.focus();

  function getCurrentRepo() {
    return repoSelect.childNodes[ repoSelect.selectedIndex ].value;
  }

  var choiceDiv = document.createElement( 'div' );
  choiceDiv.style.position = 'fixed';
  choiceDiv.style.left = ( repoSelect.clientWidth + PADDING ) + 'px';
  choiceDiv.style.top = '0';
  choiceDiv.style.textAlign = 'center';

  var choiceSelect = document.createElement( 'select' );

  var toggleDiv = document.createElement( 'div' );

  function updateChoices() {
    localStorage.setItem( 'testmarks-repo', getCurrentRepo() );
    while ( choiceSelect.childNodes.length ) { choiceSelect.removeChild( choiceSelect.childNodes[ 0 ] ); }
    choiceData[ getCurrentRepo() ].forEach( function( choice ) {
      var choiceOption = document.createElement( 'option' );
      choiceOption.value = choice.name;
      choiceOption.label = choice.text;
      choiceSelect.appendChild( choiceOption );
    } );
    choiceSelect.setAttribute( 'size', choiceData[ getCurrentRepo() ].length );
    choiceSelect.value = localStorage.getItem( 'testmarks-choice' );
    if ( choiceSelect.selectedIndex < 0 ) {
      choiceSelect.selectedIndex = 0;
    }
  }
  updateChoices();

  document.body.appendChild( choiceDiv );

  function getCurrentChoiceName() {
    return choiceSelect.childNodes[ choiceSelect.selectedIndex ].value;
  }
  function getCurrentURL() {
    var currentChoiceName = getCurrentChoiceName();
    return _.filter( choiceData[ getCurrentRepo() ], function( choice ) {
      return choice.name === currentChoiceName;
    } )[ 0 ].url;
  }

  var launchButton = document.createElement( 'button' );
  launchButton.name = 'launch';
  launchButton.innerHTML = 'Launch';

  launchButton.addEventListener( 'click', function() {
    open( getCurrentURL() );
  } );

  choiceDiv.appendChild( choiceSelect );
  choiceDiv.appendChild( document.createElement( 'br' ) );
  choiceDiv.appendChild( toggleDiv );
  choiceDiv.appendChild( document.createElement( 'br' ) );
  choiceDiv.appendChild( launchButton );

  var shiftPressed = false;
  window.addEventListener( 'keydown', function( event ) {
    shiftPressed = event.shiftKey;
  } );
  window.addEventListener( 'keyup', function( event ) {
    shiftPressed = event.shiftKey;
  } );

  function open( url ) {
    if ( shiftPressed ) {
      window.open( url, '_blank' );
    }
    else {
      window.location = url;
    }
  }

  repoSelect.addEventListener( 'change', updateChoices );

  choiceSelect.addEventListener( 'change', function() {
    localStorage.setItem( 'testmarks-choice', getCurrentChoiceName() );
  } );


  window.addEventListener( 'keydown', function( event ) {
    // Check for enter key
    if ( event.which === 13 ) {
      open( getCurrentURL() );
    }
  }, false );
}

$.ajax( {
  url: '../../chipper/data/active-runnables'
} ).done( function( activeRunnablesString ) {
  var activeRunnables = whiteSplit( activeRunnablesString );

  $.ajax( {
    url: '../../chipper/data/active-repos'
  } ).done( function( activeReposString ) {
    var activeRepos = whiteSplit( activeReposString );

    $.ajax( {
      url: '../../chipper/data/active-sims'
    } ).done( function( activeSimsString ) {
      var activeSims = whiteSplit( activeSimsString );

      populate( activeRunnables, activeRepos, activeSims );
      render( activeRunnables, activeRepos, activeSims );
    } );
  } );
} );
