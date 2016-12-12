// Copyright 2016, University of Colorado Boulder

/*
 * Page for quickly launching phet-related tasks, such as simulations, automated/unit tests, or other utilities.
 *
 * Displays three columns:
 *
 * - Repositories: A list of repositories to select from, each one of which has a number of modes.
 * - Modes: Based on the repository selected. Decides what type of URL is loaded when "Launch" or the enter key is
 *          pressed.
 * - Query Parameters: If available, controls what optional query parameters will be added to the end of the URL.
 *
 * Mode has the format:
 * {
 *   name: {string} - Internal unique value (for looking up which option was chosen, and storing in localStorage),
 *   text: {string} - Shown in the mode list,
 *   description: {string} - Shown when hovering over the mode in the list,
 *   url: {string} - The base URL to visit (without added query parameters) when the mode is chosen,
 *   queryParameters: {Array.<QueryParameter>}
 * }
 *
 * QueryParameter has the format:
 * {
 *   value: {string} - The actual query parameter included in the URL,
 *   text: {string} - Shown in the query parameter list,
 *   [default]: {boolean} - If true, the query parameter will be true by default
 * }
 */

(function() {
  'use strict';

  // Query parameters used for the following modes: requirejs, compiled, production
  var simQueryParameters = [
    { value: 'accessibility', text: 'Accessibility' },
    { value: 'audioVolume=0', text: 'Mute' },
    { value: 'fuzzMouse', text: 'Fuzz Mouse' },
    { value: 'dev', text: 'Dev' },
    { value: 'profiler', text: 'Profiler' },
    { value: 'showPointers', text: 'Pointers' },
    { value: 'showPointerAreas', text: 'Pointer Areas' },
    { value: 'showFittedBlockBounds', text: 'Fitted Block Bounds' },
    { value: 'showCanvasNodeBounds', text: 'CanvasNode Bounds' },
    { value: 'webgl=false', text: 'No WebGL' }
  ];

  // Query parameters used for requirejs and PhET-iO wrappers
  var devSimQueryParameters = [
    { value: 'brand=phet', text: 'PhET Brand', default: true },
    { value: 'ea', text: 'Assertions', default: true },
    { value: 'eall', text: 'All Assertions' }
  ];

  // Query parameters for the PhET-iO modes
  var phetIOQueryParameters = [
    { value: 'brand=phet-io&phetioStandalone&phetioLog=lines', text: 'Formatted PhET-IO Console Output' }
  ];

  // Some simulations have a supplemental html file that controls the colors for the simulation.
  var colorProfileRepos = [
    'charges-and-fields',
    'gravity-and-orbits',
    'molecule-shapes',
    'molecule-shapes-basics',
    'rutherford-scattering',
    'states-of-matter'
  ];

  // Track whether 'shift' key is pressed, so that we can change how windows are opened.  If shift is pressed, the
  // page is launched in a separate tab.
  var shiftPressed = false;
  window.addEventListener( 'keydown', function( event ) {
    shiftPressed = event.shiftKey;
  } );
  window.addEventListener( 'keyup', function( event ) {
    shiftPressed = event.shiftKey;
  } );
  function openURL( url ) {
    if ( shiftPressed ) {
      window.open( url, '_blank' );
    }
    else {
      window.location = url;
    }
  }

  /**
   * Fills out the modeData map with information about repositories, modes and query parameters.
   *
   * @param {Array.<string>} activeRunnables - from active-runnables
   * @param {Array.<string>} activeRepos - from active-repos
   * @param {Array.<string>} activeSims - from active-sims
   * @param {Array.<string>} phetioSims - from test-phetio
   * @returns {Object} - Maps from {string} repository name => {Mode}
   */
  function populate( activeRunnables, activeRepos, activeSims, phetioSims ) {
    var modeData = {};

    var phetIOTestQueryParameters = [
      {
        value: 'brand=phet-io&phetioStandalone&testSims=' + phetioSims.join( ',' ),
        text: 'Test PhET-IO sims'
      }
    ];

    activeRepos.forEach( function( repo ) {
      var modes = modeData[ repo ] = [];

      var isPhetIO = _.contains( phetioSims, repo );
      var hasColorProfile = _.contains( colorProfileRepos );

      if ( _.contains( activeRunnables, repo ) ) {
        modes.push( {
          name: 'requirejs',
          text: 'Require.js',
          description: 'Runs the simulation from the top-level development HTML in require.js mode',
          url: '../' + repo + '/' + repo + '_en.html',
          queryParameters: devSimQueryParameters.concat( isPhetIO ? phetIOQueryParameters : [] ).concat( simQueryParameters )
        } );
        modes.push( {
          name: 'compiled',
          text: 'Compiled',
          description: 'Runs the English simulation from the build/ directory (built from chipper)',
          url: '../' + repo + '/build/' + repo + '_en.html',
          queryParameters: ( isPhetIO ? phetIOQueryParameters : [] ).concat( simQueryParameters )
        } );
        modes.push( {
          name: 'production',
          text: 'Production',
          description: 'Runs the latest English simulation from the production server',
          url: 'https://phet.colorado.edu/sims/html/' + repo + '/latest/' + repo + '_en.html',
          queryParameters: ( isPhetIO ? phetIOQueryParameters : [] ).concat( simQueryParameters )
        } );
        modes.push( {
          name: 'spot',
          text: 'Dev (spot)',
          description: 'Loads the location on www.colorado.edu (spot.colorado.edu) with versions for each dev deploy',
          url: 'http://www.colorado.edu/physics/phet/dev/html/' + repo
        } );
      }

      // Color picker UI
      if ( hasColorProfile ) {
        modes.push( {
          name: 'colors',
          text: 'Color Editor',
          description: 'Runs the top-level -colors.html file (allows editing/viewing different profile colors)',
          url: '../' + repo + '/' + repo + '-colors.html'
        } );
      }

      if ( repo === 'axon' || repo === 'phet-core' || repo === 'dot' || repo === 'kite' || repo === 'scenery' ) {
        modes.push( {
          name: 'unitTestsRequirejs',
          text: 'Unit Tests (Require.js)',
          description: 'Runs unit tests in require.js mode',
          url: '../' + repo + '/tests/qunit/unit-tests.html'
        } );
        modes.push( {
          name: 'unitTestsCompiled',
          text: 'Unit Tests (Compiled)',
          description: 'Runs unit tests from a compiled (built) file. Run "grunt build-js" first',
          url: '../' + repo + '/tests/qunit/compiled-unit-tests.html'
        } );
      }
      if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' || repo === 'phet-io' ) {
        modes.push( {
          name: 'documentation',
          text: 'Documentation',
          description: 'Browse HTML documentation',
          url: '../' + repo + '/doc/'
        } );
      }
      if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' ) {
        modes.push( {
          name: 'examples',
          text: 'Examples',
          description: 'Browse Examples',
          url: '../' + repo + '/examples/'
        } );
      }
      if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' || repo === 'phet-core' ) {
        modes.push( {
          name: 'playground',
          text: 'Playground',
          description: 'Loads ' + repo + ' and dependencies in the tab, and allows quick testing',
          url: '../' + repo + '/tests/playground.html'
        } );
      }
      if ( repo === 'phet-io' ) {
        modes.push( {
          name: 'wrappers',
          text: 'Wrappers',
          description: 'Points to many dev wrappers',
          url: '../' + repo + '/html/dev-wrappers.html'
        } );
      }
      if ( repo === 'chipper' || repo === 'aqua' ) {
        modes.push( {
          name: 'test-sims',
          text: 'Test Sims (Fast Build)',
          description: 'Runs automated testing with fuzzing, 10 second timer, and 4 concurrent builds',
          url: '../aqua/test-server/test-sims.html?ea&audioVolume=0&testDuration=10000&testConcurrentBuilds=4&fuzzMouse',
          queryParameters: phetIOTestQueryParameters
        } );
        modes.push( {
          name: 'test-sims-load-only',
          text: 'Test Sims (Load Only)',
          description: 'Runs automated testing that just loads sims (without fuzzing or building)',
          url: '../aqua/test-server/test-sims.html?ea&audioVolume=0&testTask=false&testBuilt=false',
          queryParameters: phetIOTestQueryParameters
        } );
      }

      // phet-io wrappers
      [
        'index',
        'instance-proxies',
        'console',
        'mirror-inputs',
        'state',
        'active',
        'audio',
        'classroom-activity',
        'wrapper-template',
        'lab-book',
        'event-log',
        'playback',
        'record',
        'screenshot'
      ].forEach( function( wrapper ) {
        var url = wrapper === 'console' ?
                  '../' + repo + '/' + repo + '_en.html?brand=phet-io&phetioLog=lines&phetioStandalone' :
                  '../phet-io/wrappers/' + wrapper + '/' + wrapper + '.html?sim=' + repo;
        modes.push( {
          name: wrapper,
          text: wrapper,
          description: 'Runs the phet-io wrapper ' + wrapper,
          url: url,
          queryParameters: devSimQueryParameters.concat( phetIOQueryParameters ).filter( function( queryParameter ) {
            return queryParameter.value !== 'brand=phet';
          } )
        } );
      } );

      modes.push( {
        name: 'github',
        text: 'GitHub',
        description: 'Opens to the repository\'s GitHub main page',
        url: 'https://github.com/phetsims/' + repo
      } );
      modes.push( {
        name: 'issues',
        text: 'Issues',
        description: 'Opens to the repository\'s GitHub issues page',
        url: 'https://github.com/phetsims/' + repo + '/issues'
      } );
    } );

    return modeData;
  }

  function clearChildren( element ) {
    while ( element.childNodes.length ) { element.removeChild( element.childNodes[ 0 ] ); }
  }

  /**
   * @param {Object} modeData - Maps from {string} repository name => {Mode}
   * @returns { element: {HTMLSelectElement}, get value(): {string} }
   */
  function createRepositorySelector( modeData ) {
    var repositories = Object.keys( modeData );

    var select = document.createElement( 'select' );
    select.autofocus = true;
    repositories.forEach( function( repo ) {
      var option = document.createElement( 'option' );
      option.value = option.label = option.innerHTML = repo;
      select.appendChild( option );
    } );

    // IE or no-scrollIntoView will need to be height-limited
    if ( select.scrollIntoView && navigator.userAgent.indexOf( 'Trident/' ) < 0 ) {
      select.setAttribute( 'size', repositories.length );
    }
    else {
      select.setAttribute( 'size', 30 );
    }

    // Select a repository if it's been stored in localStorage before
    if ( localStorage.getItem( 'testmarks-repo' ) ) {
      select.value = localStorage.getItem( 'testmarks-repo' );
    }

    select.focus();

    // Scroll to the selected element
    select.addEventListener( 'change', function() {
      var element = select.childNodes[ select.selectedIndex ];
      if ( element.scrollIntoViewIfNeeded ) {
        element.scrollIntoViewIfNeeded();
      }
      else if ( element.scrollIntoView ) {
        element.scrollIntoView();
      }
    } );

    return {
      element: select,
      get value() {
        return select.childNodes[ select.selectedIndex ].value;
      }
    };
  }

  /**
   * @param {Object} modeData - Maps from {string} repository name => {Mode}
   * @param {Object} repositorySelector
   * @returns { element: {HTMLSelectElement},
   *            get value(): {string},
   *            get mode(): {Mode},
   *            update: function() }
   */
  function createModeSelector( modeData, repositorySelector ) {
    var select = document.createElement( 'select' );

    var selector = {
      element: select,
      get value() {
        return select.childNodes[ select.selectedIndex ].value;
      },
      get mode() {
        var currentModeName = selector.value;
        return _.filter( modeData[ repositorySelector.value ], function( mode ) {
          return mode.name === currentModeName;
        } )[ 0 ];
      },
      update: function() {
        localStorage.setItem( 'testmarks-repo', repositorySelector.value );

        clearChildren( select );
        modeData[ repositorySelector.value ].forEach( function( choice ) {
          var choiceOption = document.createElement( 'option' );
          choiceOption.value = choice.name;
          choiceOption.label = choice.text;
          choiceOption.title = choice.description;
          choiceOption.innerHTML = choice.text;
          select.appendChild( choiceOption );
        } );
        select.setAttribute( 'size', modeData[ repositorySelector.value ].length );
        select.value = localStorage.getItem( 'testmarks-choice' );
        if ( select.selectedIndex < 0 ) {
          select.selectedIndex = 0;
        }
      }
    };

    select.addEventListener( 'change', function() {
      localStorage.setItem( 'testmarks-choice', selector.value );
    } );

    return selector;
  }

  function createScreenSelector() {
    if ( typeof localStorage.getItem( 'testmarks-screens' ) !== 'string' ) {
      localStorage.setItem( 'testmarks-screens', 'all' );
    }

    var div = document.createElement( 'div' );

    function createScreenRadioButton( name, value, text ) {
      var label = document.createElement( 'label' );
      label.className = 'screenLabel';
      var radio = document.createElement( 'input' );
      radio.type = 'radio';
      radio.name = name;
      radio.value = value;
      radio.checked = localStorage.getItem( 'testmarks-screens' ) === value;
      radio.addEventListener( 'change', function() {
        var selectedValue = $( 'input[name=screens]:checked' ).val();
        localStorage.setItem( 'testmarks-screens', selectedValue );
      } );
      label.appendChild( radio );
      label.appendChild( document.createTextNode( text ) );
      return label;
    }

    div.appendChild( createScreenRadioButton( 'screens', 'all', 'All screens' ) );
    for ( var i = 1; i <= 6; i++ ) {
      div.appendChild( createScreenRadioButton( 'screens', '' + i, '' + i ) );
    }

    return {
      element: div,
      get value() {
        return $( 'input[name=screens]:checked' ).val();
      },
      reset: function() {
        $( 'input[value=all]' )[ 0 ].checked = true;
        localStorage.setItem( 'testmarks-screens', 'all' );
      }
    };
  }

  /**
   * @param {Object} modeData - Maps from {string} repository name => {Mode}
   * @param {Object} modeSelector
   * @returns { element: {HTMLSelectElement}, get value(): {string} }
   */
  function createQueryParameterSelector( modeData, modeSelector ) {
    var screenSelector = createScreenSelector();

    var customTextBox = document.createElement( 'input' );
    customTextBox.type = 'text';
    if ( localStorage.getItem( 'testmarks-customText' ) ) {
      customTextBox.value = localStorage.getItem( 'testmarks-customText' );
    }
    customTextBox.addEventListener( 'input', function() {
      localStorage.setItem( 'testmarks-customText', customTextBox.value );
    } );


    var toggleContainer = document.createElement( 'div' );

    var selector = {
      screenElement: screenSelector.element,
      toggleElement: toggleContainer,
      customElement: customTextBox,
      get value() {
        var screensValue = screenSelector.value;
        return _.map( _.filter( $( toggleContainer ).find( ':checkbox' ), function( checkbox ) {
          return checkbox.checked;
        } ), function( checkbox ) {
          return checkbox.name;
        } ).concat( customTextBox.value.length ? [ customTextBox.value ] : [] ).concat(
          screensValue === 'all' ? [] : [ 'screens=' + screensValue ]
        ).join( '&' );
      },
      update: function() {
        clearChildren( toggleContainer );

        var queryParameters = modeSelector.mode.queryParameters || [];
        queryParameters.forEach( function( parameter ) {
          var label = document.createElement( 'label' );
          var checkBox = document.createElement( 'input' );
          checkBox.type = 'checkbox';
          checkBox.name = parameter.value;
          label.appendChild( checkBox );
          label.appendChild( document.createTextNode( parameter.text + ' (' + parameter.value + ')' ) );
          toggleContainer.appendChild( label );
          toggleContainer.appendChild( document.createElement( 'br' ) );
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
      },
      reset: function() {
        screenSelector.reset();

        customTextBox.value = '';
        localStorage.setItem( 'testmarks-customText', '' );
        _.forEach( $( toggleContainer ).find( ':checkbox' ), function( checkbox ) {
          var parameter = _.filter( modeSelector.mode.queryParameters, function( param ) { return param.value === checkbox.name; } )[ 0 ];
          checkbox.checked = !!parameter.default;
          localStorage.setItem( 'testmarks-query-' + parameter.value, checkbox.checked );
        } );
      }
    };

    return selector;
  }

  /**
   * Create the view and hook everything up.
   *
   * @param {Object} modeData - Maps from {string} repository name => {Mode}
   */
  function render( modeData ) {
    var repositorySelector = createRepositorySelector( modeData );
    var modeSelector = createModeSelector( modeData, repositorySelector );
    var queryParameterSelector = createQueryParameterSelector( modeData, modeSelector );

    function getCurrentURL() {
      var queryParameters = queryParameterSelector.value;
      var url = modeSelector.mode.url;
      var separator = url.indexOf( '?' ) < 0 ? '?' : '&';
      return url + ( queryParameters.length ? separator + queryParameters : '' );
    }

    var launchButton = document.createElement( 'button' );
    launchButton.id = 'launchButton';
    launchButton.name = 'launch';
    launchButton.innerHTML = 'Launch';

    var resetButton = document.createElement( 'button' );
    resetButton.name = 'reset';
    resetButton.innerHTML = 'Reset Query Parameters';

    function header( str ) {
      var head = document.createElement( 'h3' );
      head.appendChild( document.createTextNode( str ) );
      return head;
    }

    // Divs for our three columns
    var repoDiv = document.createElement( 'div' );
    repoDiv.id = 'repositories';
    var modeDiv = document.createElement( 'div' );
    modeDiv.id = 'choices';
    var queryParametersDiv = document.createElement( 'div' );
    queryParametersDiv.id = 'queryParameters';

    // Layout of all of the major elements
    repoDiv.appendChild( header( 'Repositories' ) );
    repoDiv.appendChild( repositorySelector.element );
    modeDiv.appendChild( header( 'Modes' ) );
    modeDiv.appendChild( modeSelector.element );
    modeDiv.appendChild( document.createElement( 'br' ) );
    modeDiv.appendChild( document.createElement( 'br' ) );
    modeDiv.appendChild( launchButton );
    queryParametersDiv.appendChild( header( 'Query Parameters' ) );
    queryParametersDiv.appendChild( queryParameterSelector.toggleElement );
    queryParametersDiv.appendChild( queryParameterSelector.screenElement );
    queryParametersDiv.appendChild( document.createTextNode( 'Query Parameters: ' ) );
    queryParametersDiv.appendChild( queryParameterSelector.customElement );
    queryParametersDiv.appendChild( document.createElement( 'br' ) );
    queryParametersDiv.appendChild( resetButton );
    document.body.appendChild( repoDiv );
    document.body.appendChild( modeDiv );
    document.body.appendChild( queryParametersDiv );

    function updateQueryParameterVisibility() {
      queryParametersDiv.style.visibility = modeSelector.mode.queryParameters ? 'inherit' : 'hidden';
    }

    // Align panels based on width
    function layout() {
      modeDiv.style.left = ( repositorySelector.element.clientWidth + 20 ) + 'px';
      queryParametersDiv.style.left = ( repositorySelector.element.clientWidth + +modeDiv.clientWidth + 40 ) + 'px';
    }

    window.addEventListener( 'resize', layout );

    // Hook updates to change listeners
    function onRepositoryChanged() {
      modeSelector.update();
      onModeChanged();
    }

    function onModeChanged() {
      queryParameterSelector.update();
      updateQueryParameterVisibility();
      layout();
    }

    repositorySelector.element.addEventListener( 'change', onRepositoryChanged );
    modeSelector.element.addEventListener( 'input', onModeChanged );
    onRepositoryChanged();

    // Clicking 'Launch' or pressing 'enter' opens the URL
    function openCurrentURL() {
      openURL( getCurrentURL() );
    }

    window.addEventListener( 'keydown', function( event ) {
      // Check for enter key
      if ( event.which === 13 ) {
        openCurrentURL();
      }
    }, false );
    launchButton.addEventListener( 'click', openCurrentURL );

    // Reset
    resetButton.addEventListener( 'click', queryParameterSelector.reset );
  }

  // Splits file strings (such as chipper/data/active-runnables) into a list of entries, ignoring blank lines.
  function whiteSplit( str ) {
    return str.split( '\n' ).map( function( line ) {
      return line.replace( '\r', '' );
    } ).filter( function( line ) {
      return line.length > 0;
    } );
  }

  // Load files serially, populate then render
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

        $.ajax( {
          url: '../chipper/data/test-phetio'
        } ).done( function( testPhetioString ) {
          var phetioSims = whiteSplit( testPhetioString );

          render( populate( activeRunnables, activeRepos, activeSims, phetioSims ) );
        } );
      } );
    } );
  } );

})();
