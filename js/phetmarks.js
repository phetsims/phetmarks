// Copyright 2016, University of Colorado Boulder
// TODO: Document (by JO)

(function() {
  'use strict';

  console.log( 'loaded' );

  function whiteSplit( str ) {
    return str.split( '\n' ).map( function( line ) {
      return line.replace( '\r', '' );
    } ).filter( function( line ) {
      return line.length > 0;
    } );
  }

  var choiceData = {};

  var schema = window.phet.chipper.queryParameterSchema;

  var simQueryParameters = [
    {
      value: 'accessibility',
      text: 'Accessibility'
    },
    {
      value: 'audioVolume=0',
      text: 'Mute'
    },
    {
      value: 'fuzzMouse',
      text: 'Fuzz Mouse'
    },
    {
      value: 'dev',
      text: 'Dev'
    },
    {
      value: 'profiler',
      text: 'Profiler'
    },
    {
      value: 'showPointers',
      text: 'Pointers'
    },
    {
      value: 'showPointerAreas',
      text: 'Pointer Areas'
    },
    {
      value: 'showFittedBlockBounds',
      text: 'Fitted Block Bounds'
    },
    {
      value: 'showCanvasNodeBounds',
      text: 'CanvasNode Bounds'
    },
    {
      value: 'webgl=false',
      text: 'No WebGL'
    }
  ];

  // TODO: use the schema
  // for (var key in schema){
  //   simQueryParameters.push({
  //     value: key,
  //     text: key
  //   });
  // }

  var devSimQueryParameters = [
    {
      value: 'brand=phet',
      text: 'PhET Brand',
      default: true
    },
    {
      value: 'ea',
      text: 'Assertions',
      default: true
    },
    {
      value: 'eall',
      text: 'All Assertions'
    }
  ].concat( simQueryParameters );

  var phetIOQueryParameters = [
    {
      value: 'brand=phet-io&phet-io.standalone&phet-io.log=lines',
      text: 'Formatted PhET-IO Console Output'
    }
  ];

  function populate( activeRunnables, activeRepos, activeSims ) {
    activeRepos.forEach( function( repo ) {
      var choices = choiceData[ repo ] = [];

      var isPhetIO = _.contains( [ 'beers-law-lab', 'bending-light', 'build-an-atom', 'charges-and-fields', 'color-vision', 'concentration', 'faradays-law', 'molecules-and-light' ], repo );
      var hasColorProfile = _.contains( [ 'charges-and-fields', 'gravity-and-orbits', 'molecule-shapes', 'molecule-shapes-basics', 'rutherford-scattering', 'states-of-matter' ] );

      if ( _.contains( activeRunnables, repo ) ) {
        choices.push( {
          name: 'requirejs',
          text: 'Require.js',
          description: 'Runs the simulation from the top-level development HTML in require.js mode',
          url: '../' + repo + '/' + repo + '_en.html',
          queryParameters: ( isPhetIO ? phetIOQueryParameters : [] ).concat( devSimQueryParameters ),
          customQueryParameters: true
        } );
        choices.push( {
          name: 'compiled',
          text: 'Compiled',
          description: 'Runs the English simulation from the build/ directory (built from chipper)',
          url: '../' + repo + '/build/' + repo + '_en.html',
          queryParameters: ( isPhetIO ? phetIOQueryParameters : [] ).concat( simQueryParameters ),
          customQueryParameters: true
        } );
      }

      // Color picker UI
      if ( hasColorProfile ) {
        choices.push( {
          name: 'colors',
          text: 'Color Editor',
          description: 'Runs the top-level -colors.html file (allows editing/viewing different profile colors)',
          url: '../' + repo + '/' + repo + '-colors.html'
        } );
      }

      if ( repo === 'axon' || repo === 'phet-core' || repo === 'dot' || repo === 'kite' || repo === 'scenery' ) {
        choices.push( {
          name: 'unitTestsRequirejs',
          text: 'Unit Tests (Require.js)',
          description: 'Runs unit tests in require.js mode',
          url: '../' + repo + '/tests/qunit/unit-tests.html'
        } );
        choices.push( {
          name: 'unitTestsCompiled',
          text: 'Unit Tests (Compiled)',
          description: 'Runs unit tests from a compiled (built) file. Run "grunt build-js" first',
          url: '../' + repo + '/tests/qunit/compiled-unit-tests.html'
        } );
      }
      if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' || repo === 'phet-io' ) {
        choices.push( {
          name: 'documentation',
          text: 'Documentation',
          description: 'Browse HTML documentation',
          url: '../' + repo + '/doc/'
        } );
      }
      if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' ) {
        choices.push( {
          name: 'examples',
          text: 'Examples',
          description: 'Browse Examples',
          url: '../' + repo + '/examples/'
        } );
      }
      if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' || repo === 'phet-core' ) {
        choices.push( {
          name: 'playground',
          text: 'Playground',
          description: 'Loads ' + repo + ' and dependencies in the tab, and allows quick testing',
          url: '../' + repo + '/tests/playground.html'
        } );
      }
      if ( repo === 'phet-io' ) {
        choices.push( {
          name: 'wrappers',
          text: 'Wrappers',
          description: 'Points to many dev wrappers',
          url: '../' + repo + '/html/dev-wrappers.html'
        } );
      }
      if ( repo === 'phetmarks' ) {
        choices.push( {
          name: 'launcher',
          text: 'Launcher',
          description: 'Launcher for phet-io',
          url: '../phetmarks/launcher'
        } );
      }
      if ( repo === 'chipper' || repo === 'aqua' ) {
        choices.push( {
          name: 'test-sims',
          text: 'Test Sims (Fast Build)',
          description: 'Runs automated testing with fuzzing, 10 second timer, and 4 concurrent builds',
          url: '../aqua/test-server/test-sims.html?ea&audioVolume=0&testDuration=10000&testConcurrentBuilds=4&fuzzMouse'
        } );
        choices.push( {
          name: 'test-sims-load-only',
          text: 'Test Sims (Load Only)',
          description: 'Runs automated testing that just loads sims (without fuzzing or building)',
          url: '../aqua/test-server/test-sims.html?ea&audioVolume=0&testTask=false&testBuilt=false'
        } );
      }

      // phet-io wrappers
      if ( isPhetIO ) {
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
            description: 'Runs the phet-io wrapper ' + wrapper,
            url: '../phet-io/wrappers/' + wrapper + '/' + wrapper + '.html?sim=' + repo,
            queryParameters: phetIOQueryParameters.concat( devSimQueryParameters ),
            customQueryParameters: true
          } );
        } );
      }

      choices.push( {
        name: 'github',
        text: 'GitHub',
        description: 'Opens to the repository\'s GitHub main page',
        url: 'https://github.com/phetsims/' + repo
      } );
      choices.push( {
        name: 'issues',
        text: 'Issues',
        description: 'Opens to the repository\'s GitHub issues page',
        url: 'https://github.com/phetsims/' + repo + '/issues'
      } );
    } );
  }

  function render( activeRunnables, activeRepos, activeSims ) {
    var repoDiv = document.createElement( 'div' );
    repoDiv.id = 'repositories';

    var repoSelect = document.createElement( 'select' );
    repoSelect.autofocus = true;
    activeRepos.forEach( function( repo ) {
      var repoOption = document.createElement( 'option' );
      repoOption.value = repo;
      repoOption.label = repo;
      repoOption.innerHTML = repo;
      repoSelect.appendChild( repoOption );
    } );
    if ( repoSelect.scrollIntoView && navigator.userAgent.indexOf( 'Trident/' ) < 0 ) {
      repoSelect.setAttribute( 'size', activeRepos.length );
    }
    else {
      repoSelect.setAttribute( 'size', 30 );
    }
    if ( localStorage.getItem( 'testmarks-repo' ) ) {
      repoSelect.value = localStorage.getItem( 'testmarks-repo' );
    }

    repoSelect.focus();

    function getCurrentRepo() {
      return repoSelect.childNodes[ repoSelect.selectedIndex ].value;
    }

    var choiceDiv = document.createElement( 'div' );
    choiceDiv.id = 'choices';

    var queryParametersDiv = document.createElement( 'div' );
    queryParametersDiv.id = 'queryParameters';

    var choiceSelect = document.createElement( 'select' );

    var toggleDiv = document.createElement( 'div' );
    window.toggleDiv = toggleDiv;

    function updateChoices() {
      localStorage.setItem( 'testmarks-repo', getCurrentRepo() );
      while ( choiceSelect.childNodes.length ) { choiceSelect.removeChild( choiceSelect.childNodes[ 0 ] ); }
      choiceData[ getCurrentRepo() ].forEach( function( choice ) {
        var choiceOption = document.createElement( 'option' );
        choiceOption.value = choice.name;
        choiceOption.label = choice.text;
        choiceOption.title = choice.description;
        choiceOption.innerHTML = choice.text;
        choiceSelect.appendChild( choiceOption );
      } );
      choiceSelect.setAttribute( 'size', choiceData[ getCurrentRepo() ].length );
      choiceSelect.value = localStorage.getItem( 'testmarks-choice' );
      if ( choiceSelect.selectedIndex < 0 ) {
        choiceSelect.selectedIndex = 0;
      }

      updateQueryParameters();
    }

    var customTextBox = document.createElement( 'input' );
    customTextBox.type = 'text';
    if ( localStorage.getItem( 'testmarks-customText' ) ) {
      customTextBox.value = localStorage.getItem( 'testmarks-customText' );
    }
    customTextBox.addEventListener( 'input', function() {
      localStorage.setItem( 'testmarks-customText', customTextBox.value );
    } );

    var screensDiv = document.createElement( 'div' );
    function createScreenRadioButton( name, value, text ) {
      var label = document.createElement( 'label' );
      label.className = 'screenLabel';
      var radio = document.createElement( 'input' );
      radio.type = 'radio';
      radio.name = name;
      radio.value = value;
      if ( typeof localStorage.getItem( 'testmarks-screens-' + value ) !== 'string' ) {
        radio.checked = value === 'all';
        localStorage.setItem( 'testmarks-screens-' + value, radio.checked );
      }
      else {
        radio.checked = localStorage.getItem( 'testmarks-screens-' + value ) === 'true';
      }
      radio.addEventListener( 'change', function() {
        var selectedValue = $( 'input[name=screens]:checked' ).val();
        [ 'all', '1', '2', '3', '4', '5', '6' ].forEach( function( otherValue ) {
          localStorage.setItem( 'testmarks-screens-' + otherValue, otherValue === selectedValue );
        } );
      } );
      label.appendChild( radio );
      label.appendChild( document.createTextNode( text ) );
      return label;
    }
    screensDiv.appendChild( createScreenRadioButton( 'screens', 'all', 'All screens' ) );
    for ( var i = 1; i <= 6; i++ ) {
      screensDiv.appendChild( createScreenRadioButton( 'screens', '' + i, '' + i ) );
    }

    document.body.appendChild( repoDiv );
    document.body.appendChild( choiceDiv );
    document.body.appendChild( queryParametersDiv );

    function getCurrentChoiceName() {
      return choiceSelect.childNodes[ choiceSelect.selectedIndex ].value;
    }

    function getCurrentChoice() {
      var currentChoiceName = getCurrentChoiceName();
      return _.filter( choiceData[ getCurrentRepo() ], function( choice ) {
        return choice.name === currentChoiceName;
      } )[ 0 ];
    }

    function getQueryParameters() {
      var screensValue = $( 'input[name=screens]:checked' ).val();
      return _.map( _.filter( $( toggleDiv ).find( ':checkbox' ), function( checkbox ) {
        return checkbox.checked;
      } ), function( checkbox ) {
        return checkbox.name;
      } ).concat( customTextBox.value.length ? [ customTextBox.value ] : [] ).concat(
        screensValue === 'all' ? [] : [ 'screens=' + screensValue ]
      ).join( '&' );
    }

    function getCurrentURL() {
      var queryParameters = getQueryParameters();
      return getCurrentChoice().url + ( queryParameters.length ? '?' + queryParameters : '' );
    }

    function updateQueryParameters() {
      while ( toggleDiv.childNodes.length ) { toggleDiv.removeChild( toggleDiv.childNodes[ 0 ] ); }

      queryParametersDiv.style.visibility = getCurrentChoice().customQueryParameters ? 'inherit' : 'hidden';

      var queryParameters = getCurrentChoice().queryParameters || [];
      queryParameters.forEach( function( parameter ) {
        var label = document.createElement( 'label' );
        var checkBox = document.createElement( 'input' );
        checkBox.type = 'checkbox';
        checkBox.name = parameter.value;
        label.appendChild( checkBox );
        label.appendChild( document.createTextNode( parameter.text + ' (' + parameter.value + ')' ) );
        toggleDiv.appendChild( label );
        toggleDiv.appendChild( document.createElement( 'br' ) );
        var checked = localStorage.getItem( 'testmarks-query-' + parameter.value );
        if ( typeof checked === 'string' ) {
          checkBox.checked = checked === 'true';
        }
        else {
          checkBox.checked = !!parameter.default;
        }

        checkBox.addEventListener( 'change', function() {
          localStorage.setItem( 'testmarks-query-' + parameter.value, checkBox.checked );
        } );

      } );

      layout();
    }

    function layout() {
      var windowWidth = window.innerWidth;
      choiceDiv.style.left = ( repoSelect.clientWidth + 20 ) + 'px';
      queryParametersDiv.style.left = ( repoSelect.clientWidth + +choiceDiv.clientWidth + 40 ) + 'px';
    }

    window.addEventListener( 'resize', layout );

    var launchButton = document.createElement( 'button' );
    launchButton.id = 'launchButton';
    launchButton.name = 'launch';
    launchButton.innerHTML = 'Launch';

    launchButton.addEventListener( 'click', function() {
      open( getCurrentURL() );
    } );

    var resetButton = document.createElement( 'button' );
    resetButton.name = 'reset';
    resetButton.innerHTML = 'Reset Query Parameters';

    resetButton.addEventListener( 'click', function() {
      customTextBox.value = '';
      localStorage.setItem( 'testmarks-customText', '' )
      _.forEach( $( toggleDiv ).find( ':checkbox' ), function( checkbox ) {
        var parameter = _.filter( getCurrentChoice().queryParameters, function( param ) { return param.value === checkbox.name; } )[ 0 ];
        checkbox.checked = !!parameter.default;
        localStorage.setItem( 'testmarks-query-' + parameter.value, checkbox.checked );
      } );
    } );

    function header( str ) {
      var head = document.createElement( 'h3' );
      head.appendChild( document.createTextNode( str ) );
      return head;
    }

    repoDiv.appendChild( header( 'Repositories' ) );
    repoDiv.appendChild( repoSelect );
    choiceDiv.appendChild( header( 'Modes' ) );
    choiceDiv.appendChild( choiceSelect );
    choiceDiv.appendChild( document.createElement( 'br' ) );
    choiceDiv.appendChild( document.createElement( 'br' ) );
    choiceDiv.appendChild( launchButton );
    queryParametersDiv.appendChild( header( 'Query Parameters' ) );
    queryParametersDiv.appendChild( toggleDiv );
    queryParametersDiv.appendChild( screensDiv );
    queryParametersDiv.appendChild( document.createTextNode( 'Query Parameters: ' ) );
    queryParametersDiv.appendChild( customTextBox );
    queryParametersDiv.appendChild( document.createElement( 'br' ) );
    queryParametersDiv.appendChild( resetButton );

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

    repoSelect.addEventListener( 'change', function() {
      var element = repoSelect.childNodes[ repoSelect.selectedIndex ];
      if ( element.scrollIntoViewIfNeeded ) {
        element.scrollIntoViewIfNeeded();
      }
      else if ( element.scrollIntoView ) {
        element.scrollIntoView();
      }
    } );

    choiceSelect.addEventListener( 'change', function() {
      localStorage.setItem( 'testmarks-choice', getCurrentChoiceName() );
    } );

    choiceSelect.addEventListener( 'input', updateQueryParameters );
    updateChoices();

    window.addEventListener( 'keydown', function( event ) {
      // Check for enter key
      if ( event.which === 13 ) {
        open( getCurrentURL() );
      }
    }, false );
  }

  $.ajax( {
    url: '../chipper/data/active-runnables'
  } ).done( function( activeRunnablesString ) {
    var activeRunnables = whiteSplit( activeRunnablesString );

    $.ajax( {
      url: '../chipper/data/active-repos'
    } ).done( function( activeReposString ) {
      var activeRepos = whiteSplit( activeReposString );

      $.ajax( {
        url: '../chipper/data/active-sims'
      } ).done( function( activeSimsString ) {
        var activeSims = whiteSplit( activeSimsString );

        populate( activeRunnables, activeRepos, activeSims );
        render( activeRunnables, activeRepos, activeSims );
      } );
    } );
  } );

})();