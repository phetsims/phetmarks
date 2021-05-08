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
 *   name: {string} - Internal unique value (for looking up which option was chosen),
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
    'area-model-multiplication',
    'charges-and-fields',
    'gravity-and-orbits',
    'molecule-shapes',
    'molecule-shapes-basics',
    'proportion-playground',
    'rutherford-scattering',
    'states-of-matter'
  ];

  /**
   * Returns a local-storage key that has additional information included, to prevent collision with other applications (or in the future, previous
   * versions of phetmarks).
   * @public
   *
   * @param {string} key
   * @returns {string}
   */
  function storageKey( key ) {
    return 'phetmarks-' + key;
  }

  /**
   * From the wrapper path in chipper/data/wrappers, get the name of the wrapper.
   * @param {string} wrapper
   * @returns {string} - the name of the wrapper
   */
  var getWrapperName = function( wrapper ) {

    // If the wrapper has its own individual repo, then get the name 'classroom-activity' from 'phet-io-wrapper-classroom-activity'
    // Maintain compatibility for wrappers in 'phet-io-wrappers-'
    var wrapperParts = wrapper.split( 'phet-io-wrapper-' );
    var wrapperName = wrapperParts.length === 1 ? wrapperParts[ 0 ] : wrapperParts[ 1 ];

    // If the wrapper still has slashes in it, then it looks like 'phet-io-wrappers/active'
    var splitOnSlash = wrapperName.split( '/' );
    return splitOnSlash[ splitOnSlash.length - 1 ];
  };

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
   * @param {Array.<string>} phetioSims - from phet-io
   * @param {Array.<string>} accessibleSims - from accessibility
   * @param {Array.<string>} wrappers - from wrappers
   * @returns {Object} - Maps from {string} repository name => {Mode}
   */
  function populate( activeRunnables, activeRepos, phetioSims, accessibleSims, wrappers ) {
    var modeData = {};

    activeRepos.forEach( function( repo ) {
      var modes = [];
      modeData[ repo ] = modes;

      var isPhetIO = _.includes( phetioSims, repo );
      var hasColorProfile = _.includes( colorProfileRepos, repo );
      var isRunnable = _.includes( activeRunnables, repo );
      var isAccessible = _.includes( accessibleSims, repo );

      if ( isRunnable ) {
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
          queryParameters: (isPhetIO ? phetIOQueryParameters : []).concat( simQueryParameters )
        } );
        modes.push( {
          name: 'production',
          text: 'Production',
          description: 'Runs the latest English simulation from the production server',
          url: 'https://phet.colorado.edu/sims/html/' + repo + '/latest/' + repo + '_en.html',
          queryParameters: (isPhetIO ? phetIOQueryParameters : []).concat( simQueryParameters )
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

      if ( repo === 'scenery' ) {
        modes.push( {
          name: 'inspector',
          text: 'Inspector',
          description: 'Displays saved Scenery snapshots',
          url: '../' + repo + '/tests/inspector.html'
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
          description: 'Runs unit tests from a compiled (built) file. Run "grunt build" first',
          url: '../' + repo + '/tests/qunit/compiled-unit-tests.html',
          generalTest: repo === 'scenery' ? true : undefined // only add general test once
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
          name: 'test-iframe-api',
          text: 'Test the iframe API',
          description: 'Runs the ifram API test suite',
          url: '../' + repo + '/tests/test-iframe-api'
        } );
      }
      if ( repo === 'chipper' || repo === 'aqua' ) {
        var testParameters = [ {
          value: 'ea&brand=phet&audioVolume=0&testDuration=10000&testConcurrentBuilds=4&fuzzMouse',
          text: 'Test PhET sims',
          default: true,
          generalTest: true
        },
          {
            value: 'ea&brand=phet-io&audioVolume=0&testDuration=10000&testConcurrentBuilds=4&fuzzMouse&phetioStandalone&testSims=' + phetioSims.join( ',' ),
            text: 'Test PhET-IO sims',
            default: false,
            generalTest: true
          }
        ];

        modes.push( {
          name: 'test-sims',
          text: 'Test Sims (Fast Build)',
          description: 'Runs automated testing with fuzzing, 10 second timer, and 4 concurrent builds',
          url: '../aqua/test-server/test-sims.html',
          generalTest: repo === 'aqua' ? true : undefined, // only add general test once
          queryParameters: testParameters
        } );
        modes.push( {
          name: 'test-sims-load-only',
          text: 'Test Sims (Load Only)',
          description: 'Runs automated testing that just loads sims (without fuzzing or building)',
          url: '../aqua/test-server/test-sims.html',
          queryParameters: testParameters
        } );
        modes.push( {
          name: 'continuous-testing',
          text: 'Continuous Testing',
          description: 'Link to the continuous testing on Bayes.',
          url: 'https://bayes.colorado.edu/continuous-testing/aqua/html/continuous-report.html'
        } );
      }

      if ( isAccessible ) {
        modes.push( {
          name: 'a11y-view',
          text: 'A11y View',
          description: 'Runs the simulation in an iframe next to a copy of the PDOM tot easily inspect accessible content.',
          url: '../' + repo + '/' + repo + '-a11y-view.html',
          queryParameters: devSimQueryParameters.concat( simQueryParameters )
        } );
      }

      // if a phet-io sim, then add the wrappers to them
      if ( isPhetIO ) {

        // Add a link to the compiled index wrapper;
        modes.push( {
          name: 'compiled-index',
          text: 'Compiled Index',
          description: 'Runs the PhET-iO index wrapper from build/ directory (built from chipper)',
          url: '../' + repo + '/build/wrappers/index',
          queryParameters: (isPhetIO ? phetIOQueryParameters : []).concat( simQueryParameters )
        } );

        // phet-io wrappers
        wrappers.forEach( function( wrapper ) {

          var wrapperName = getWrapperName( wrapper );

          var url = '';

          // Process for dedicated wrapper repos
          if ( wrapper.indexOf( 'phet-io-wrapper-' ) === 0 ) {

            // Special use case for the sonification wrapper
            url = wrapperName === 'sonification' ? '../phet-io-wrapper-' + wrapperName + '/' + repo + '-sonification.html?sim=' + repo :
                  '../' + wrapper + '/' + wrapperName + '.html?sim=' + repo;

            modes.push( {
              name: wrapperName,
              text: wrapperName,
              description: 'Runs the phet-io wrapper ' + wrapperName,
              url: url,
              queryParameters: devSimQueryParameters.concat( phetIOQueryParameters ).filter( function( queryParameter ) {
                return queryParameter.value !== 'brand=phet';
              } )
            } );
          }

          // Load the wrapper urls for the phet-io-wrappers/
          else {
            url = '../' + wrapper + '/' + wrapperName + '.html?sim=' + repo;

            // Add a validateTandems checkbox to the index wrapper, see https://github.com/phetsims/phet-io/issues/620
            url = wrapperName === 'index' ? url + '&toggleValidateTandems' : url;

            modes.push( {
              name: wrapperName,
              text: wrapperName,
              description: 'Runs the phet-io wrapper ' + wrapperName,
              url: url,
              queryParameters: devSimQueryParameters.concat( phetIOQueryParameters ).filter( function( queryParameter ) {
                return queryParameter.value !== 'brand=phet';
              } )
            } );
          }
        } );

        // Add the console logging, not a wrapper but nice to have
        modes.push( {
          name: 'console',
          text: 'console',
          description: 'Show the event log in the console of the stand alone sim.',
          url: '../' + repo + '/' + repo + '_en.html?brand=phet-io&phetioLog=lines&phetioStandalone',
          queryParameters: devSimQueryParameters.concat( phetIOQueryParameters ).filter( function( queryParameter ) {
            return queryParameter.value !== 'brand=phet';
          } )
        } );
      }

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
   * @param {Array.<string>} repositories - All repository names
   * @returns { element: {HTMLSelectElement}, get value(): {string} }
   */
  function createRepositorySelector( repositories ) {
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
    var repoKey = storageKey( 'repo' );
    if ( localStorage.getItem( repoKey ) ) {
      select.value = localStorage.getItem( repoKey );
    }

    select.focus();

    // Scroll to the selected element
    function tryScroll() {
      var element = select.childNodes[ select.selectedIndex ];
      if ( element.scrollIntoViewIfNeeded ) {
        element.scrollIntoViewIfNeeded();
      }
      else if ( element.scrollIntoView ) {
        element.scrollIntoView();
      }
    }

    select.addEventListener( 'change', tryScroll );
    // We need to wait for things to load fully before scrolling (in Chrome).
    // See https://github.com/phetsims/phetmarks/issues/13
    setTimeout( tryScroll, 0 );

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
        localStorage.setItem( storageKey( 'repo' ), repositorySelector.value );

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
        if ( select.selectedIndex < 0 ) {
          select.selectedIndex = 0;
        }
      }
    };

    return selector;
  }

  function createScreenSelector() {
    var div = document.createElement( 'div' );

    function createScreenRadioButton( name, value, text ) {
      var label = document.createElement( 'label' );
      label.className = 'screenLabel';
      var radio = document.createElement( 'input' );
      radio.type = 'radio';
      radio.name = name;
      radio.value = value;
      radio.checked = value === 'all';
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
      }
    };
  }

  /**
   * @param {Object} modeSelector
   * @returns { element: {HTMLSelectElement}, get value(): {string} }
   */
  function createQueryParameterSelector( modeSelector ) {
    var screenSelector = createScreenSelector();

    var customTextBox = document.createElement( 'input' );
    customTextBox.type = 'text';

    var toggleContainer = document.createElement( 'div' );

    var selector = {
      screenElement: screenSelector.element,
      toggleElement: toggleContainer,
      customElement: customTextBox,
      get value() {
        var screensValue = screenSelector.value;
        var checkboxes = $( toggleContainer ).find( ':checkbox' );
        var checkedCheckboxes = _.filter( checkboxes, function( checkbox ) {
          return checkbox.checked;
        } );
        var checkboxQueryParameters = _.map( checkedCheckboxes, function( checkbox ) {
          return checkbox.name;
        } );
        var customQueryParameters = customTextBox.value.length ? [ customTextBox.value ] : [];
        var screenQueryParameters = screensValue === 'all' ? [] : [ 'screens=' + screensValue ];
        return checkboxQueryParameters.concat( customQueryParameters ).concat( screenQueryParameters ).join( '&' );
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
          checkBox.checked = !!parameter.default;
        } );
      },
      reset: function() {
        screenSelector.reset();

        customTextBox.value = '';

        // For each checkbox, set it to its default
        _.forEach( $( toggleContainer ).find( ':checkbox' ), function( checkbox ) {
          // Grab the parameter object
          var parameter = _.filter( modeSelector.mode.queryParameters, function( param ) { return param.value === checkbox.name; } )[ 0 ];

          // Handle when the default isn't defined (it would be false)
          checkbox.checked = !!parameter.default;
        } );
      }
    };

    return selector;
  }

  /**
   * Parse through all of the modes for all repos, and get all modes that have the flag "generalTest". This marker opts in to
   * the general test launch button feature.
   * @param {Object.<Array.<Object>>} modeData
   * @returns {Array}
   */
  function getAllGeneralTestModes( modeData ) {
    var generalTestModes = [];

    var repos = Object.keys( modeData );
    for ( var i = 0; i < repos.length; i++ ) {
      var modes = modeData[ repos[ i ] ];
      for ( var j = 0; j < modes.length; j++ ) {
        var mode = modes[ j ];
        if ( mode.generalTest ) {
          generalTestModes.push( mode );
        }
      }
    }

    return generalTestModes;
  }

  /**
   * Create the view and hook everything up.
   *
   * @param {Object} modeData - Maps from {string} repository name => {Mode}
   */
  function render( modeData ) {
    var repositorySelector = createRepositorySelector( Object.keys( modeData ) );
    var modeSelector = createModeSelector( modeData, repositorySelector );
    var queryParameterSelector = createQueryParameterSelector( modeSelector );

    function getURL( url, queryParameters ) {
      var separator = url.indexOf( '?' ) < 0 ? '?' : '&';
      return url + (queryParameters.length ? separator + queryParameters : '');
    }

    function getCurrentURL() {
      var queryParameters = queryParameterSelector.value;
      var url = modeSelector.mode.url;
      return getURL( url, queryParameters );
    }

    var launchButton = document.createElement( 'button' );
    launchButton.id = 'launchButton';
    launchButton.name = 'launch';
    launchButton.innerHTML = 'Launch';

    var generalTest = document.createElement( 'button' );
    generalTest.id = 'generalTest';
    generalTest.name = 'launch';
    generalTest.innerHTML = 'General Test';

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
    modeDiv.appendChild( document.createElement( 'br' ) );
    modeDiv.appendChild( document.createElement( 'br' ) );
    modeDiv.appendChild( generalTest );
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
      modeDiv.style.left = (repositorySelector.element.clientWidth + 20) + 'px';
      queryParametersDiv.style.left = (repositorySelector.element.clientWidth + +modeDiv.clientWidth + 40) + 'px';
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
    generalTest.addEventListener( 'click', function() {

      // get all of the mode objects that want to be included in the general test popup
      var generalTestModes = getAllGeneralTestModes( modeData );

      var urlsToTest = [];
      generalTestModes.forEach( function( mode ) {
        if ( mode.queryParameters ) {

          // TODO: support a url with query parameters, but none of the query parameters selected, or all query parameters in 1 url link like ?ea&fuzzMouse.
          mode.queryParameters.forEach( function( queryParameter ) {
            if ( queryParameter.generalTest ) {

              // A url with a specific query parameter, like aqua using the 'Test PhET-iO' query parameter combo
              urlsToTest.push( getURL( mode.url, queryParameter.value ) );
            }
          } );
        }
        else {

          // If no query parameters available
          urlsToTest.push( getURL( mode.url, '' ) );
        }
      } );

      var popup = window.open( '', 'General Test', 'PopUp, scrollable=true' );
      if ( popup ) {
        popup.document.write( '<html><head></head><body><h3>General Testing</h3></body></html>' );

        urlsToTest.forEach( function( item ) {
          var iframe = popup.document.createElement( 'iframe' );
          iframe.src = item;
          iframe.style.width = '90%';
          iframe.style.height = '40%';
          iframe.style.marginBottom = '5px';
          var heading = popup.document.createElement( 'p' );
          heading.innerHTML = item;
          popup.document.body.appendChild( heading );
          popup.document.body.appendChild( iframe );
        } );

        // center the popup
        popup.moveTo( 150, 100 );

        // resize the popup to the desired dimensions
        var m = 7 / 8; // multiplier
        popup.resizeTo( m * window.screen.availWidth, m * window.screen.availHeight );

        // Call the resize function again on delay to trigger the scoll bar to refresh, in this case adding it on.
        setTimeout( function() {
          popup.resizeTo( m * window.screen.availWidth, m * window.screen.availHeight );
        }, 1000 );
      }
      else {
        console.log( 'Could not create pop up to test general links in one window.' );
      }
    } );
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
        url: '../chipper/data/phet-io'
      } ).done( function( testPhetioString ) {
        var phetioSims = whiteSplit( testPhetioString );

        $.ajax( {
          url: '../chipper/data/accessibility'
        } ).done( function( accessibleSimsString ) {
          var accessibleSims = whiteSplit( accessibleSimsString );

          render( populate( activeRunnables, activeRepos, phetioSims, accessibleSims, [ 'phet-io-wrappers/active', 'phet-io-wrappers/api-diff', 'phet-io-wrappers/documentation', 'phet-io-wrappers/event-log', 'phet-io-wrappers/index', 'phet-io-wrappers/studio', 'phet-io-wrappers/login', 'phet-io-wrappers/mirror-inputs', 'phet-io-wrappers/multi', 'phet-io-wrappers/record', 'phet-io-wrappers/playback', 'phet-io-wrappers/screenshot', 'phet-io-wrappers/state', 'phet-io-wrappers/wrapper-template', 'phet-io-wrapper-classroom-activity', 'phet-io-wrapper-lab-book' ] ) );
        } );
      } );
    } );
  } );

})();
