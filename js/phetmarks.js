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
 *   group: {string} - The optgroup that this mode belongs to
 *   description: {string} - Shown when hovering over the mode in the list,
 *   url: {string} - The base URL to visit (without added query parameters) when the mode is chosen,
 *   queryParameters: {Array.<QueryParameter>}
 * }
 *
 * QueryParameter has the format:
 * {
 *   value: {string} - The actual query parameter included in the URL,
 *   text: {string} - Shown in the query parameter list,
 *   [type]: {'boolean'} - if boolean, then it will add "=true" or "=false" to the checkbox value
 *   [default]: {boolean} - If true, the query parameter will be true by default
 * }
 */

( function() {
  'use strict';

  // Query parameters used for the following modes: requirejs, compiled, production
  var simQueryParameters = [
    { value: 'a11y', text: 'Accessibility' },
    { value: 'supportsSound', text: 'Supports Sound' },
    { value: 'supportsEnhancedSound', text: 'Supports Enhanced Sound' },
    { value: 'audioVolume=0', text: 'Mute' },
    { value: 'fuzz', text: 'Fuzz' },
    { value: 'fuzzBoard', text: 'Keyboard Fuzz' },
    { value: 'dev', text: 'Dev' },
    { value: 'profiler', text: 'Profiler' },
    { value: 'showPointers', text: 'Pointers' },
    { value: 'showPointerAreas', text: 'Pointer Areas' },
    { value: 'showFittedBlockBounds', text: 'Fitted Block Bounds' },
    { value: 'showCanvasNodeBounds', text: 'CanvasNode Bounds' },
    { value: 'webgl=false', text: 'No WebGL' }
  ];

  var eaObject = { value: 'ea', text: 'Assertions', default: true };

  // Query parameters used for requirejs and PhET-iO wrappers
  var devSimQueryParameters = [
    { value: 'brand=phet', text: 'PhET Brand', default: true },
    eaObject,
    { value: 'eall', text: 'All Assertions' }
  ];

  var phetioBaseParameters = [
    {
      value: 'phetioValidateTandems',
      default: true,
      text: 'Validate that required tandems are supplied, etc.'
    },
    {
      value: 'phetioEmitHighFrequencyEvents',
      default: true,
      type: 'boolean',
      text: 'Emit events that occur often'
    },
    {
      value: 'phetioEmitStates',
      default: false,
      type: 'boolean',
      text: 'Emit states to the data stream'
    },
    {
      value: 'phetioValidateAPI',
      default: true,
      type: 'boolean',
      text: 'Validate the phet-io api, including testing metadata against the baseline elements api file.'
    }
  ];

  // Query parameters for the PhET-iO wrappers (including iframe tests)
  var phetioWrapperQueryParameters = phetioBaseParameters.concat( [
    {
      value: 'phetioDebug',
      text: 'Enable assertions for wrappers, basically the phet-io version of ?ea',
      default: true
    }
  ] );

  // For phetio sim frame links
  var phetioSimQueryParameters = phetioBaseParameters.concat( [
    eaObject, // this needs to be first in this list
    { value: 'brand=phet-io&phetioStandalone&phetioConsoleLog=colorized', text: 'Formatted PhET-IO Console Output' },
    {
      value: 'phetioPrintMissingTandems',
      default: false,
      text: 'Print tandems that have not yet been added'
    }
  ] );

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
   * @param {Array.<string>} colorProfileRepos - Has a color profile
   * @param {Array.<string>} unitTestsRepos - Has unit tests
   * @returns {Object} - Maps from {string} repository name => {Mode}
   */
  function populate( activeRunnables, activeRepos, phetioSims, accessibleSims, wrappers, colorProfileRepos, unitTestsRepos ) {
    var modeData = {};

    activeRepos.forEach( function( repo ) {
      var modes = [];
      modeData[ repo ] = modes;

      var isPhetio = _.includes( phetioSims, repo );
      var hasColorProfile = _.includes( colorProfileRepos, repo );
      var hasUnitTests = _.includes( unitTestsRepos, repo );
      var isRunnable = _.includes( activeRunnables, repo );
      var isAccessible = _.includes( accessibleSims, repo );

      if ( isRunnable ) {
        modes.push( {
          name: 'requirejs',
          text: 'Require.js',
          description: 'Runs the simulation from the top-level development HTML in require.js mode',
          url: '../' + repo + '/' + repo + '_en.html',
          queryParameters: devSimQueryParameters.concat( simQueryParameters )
        } );
        modes.push( {
          name: 'compiled',
          text: 'Compiled',
          description: 'Runs the English simulation from the build/phet/ directory (built from chipper)',
          url: '../' + repo + '/build/phet/' + repo + '_en_phet.html',
          queryParameters: simQueryParameters
        } );
        modes.push( {
          name: 'compiledXHTML',
          text: 'Compiled XHTML',
          description: 'Runs the English simulation from the build/phet/xhtml directory (built from chipper)',
          url: '../' + repo + '/build/phet/xhtml/' + repo + '_all.xhtml',
          queryParameters: simQueryParameters
        } );
        modes.push( {
          name: 'production',
          text: 'Production',
          description: 'Runs the latest English simulation from the production server',
          url: 'https://phet.colorado.edu/sims/html/' + repo + '/latest/' + repo + '_en.html',
          queryParameters: simQueryParameters
        } );
        modes.push( {
          name: 'spot',
          text: 'Dev (spot)',
          description: 'Loads the location on phet-dev.colorado.edu with versions for each dev deploy',
          url: 'https://phet-dev.colorado.edu/html/' + repo
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

      if ( hasUnitTests ) {

        modes.push( {
          name: 'unitTestsRequirejs',
          text: 'Unit Tests (Require.js)',
          description: 'Runs unit tests in require.js mode',
          url: '../' + repo + '/' + repo + '-tests.html',
          queryParameters: [ { value: 'ea', text: 'Assertions', default: true } ]
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
      if ( repo === 'chipper' || repo === 'aqua' ) {
        var generalTestParams = 'ea&audioVolume=0&sound=disabled&testDuration=10000&testConcurrentBuilds=4';
        var fuzzTestParameter = [ {
          value: generalTestParams + '&brand=phet&fuzz',
          text: 'Test PhET sims',
          default: true
        } ];

        modes.push( {
          name: 'test-phet-sims',
          text: 'Fuzz Test PhET Sims (Fast Build)',
          description: 'Runs automated testing with fuzzing, 10 second timer, and 4 concurrent builds',
          url: '../aqua/test-server/test-sims.html',
          queryParameters: fuzzTestParameter
        } );
        modes.push( {
          name: 'test-phet-io-sims',
          text: 'Fuzz Test PhET-iO Sims (Fast Build)',
          description: 'Runs automated testing with fuzzing, 10 second timer, and 4 concurrent builds',
          url: '../aqua/test-server/test-sims.html',
          queryParameters: [ {
            value: generalTestParams + '&brand=phet-io&fuzz&phetioStandalone&testSims=' + phetioSims.join( ',' ),
            text: 'Fuzz Test PhET-IO sims',
            default: true
          } ]
        } );
        modes.push( {
          name: 'test-a11y-sims',
          text: 'Fuzz Test Accessibility Sims (Fast Build)',
          description: 'Runs automated testing with fuzzing, 10 second timer, and 4 concurrent builds',
          url: '../aqua/test-server/test-sims.html',
          queryParameters: [ {
            value: generalTestParams + '&brand=phet&fuzzBoard&a11y',
            text: 'Keyboard Fuzz Test sims',
            default: true
          }, {
            value: generalTestParams + '&brand=phet&fuzz&a11y',
            text: 'Normal Fuzz Test sims',
            default: false
          }, {
            value: 'testSims=' + accessibleSims.join( ',' ),
            text: 'Test only A11y sims',
            default: true
          } ]
        } );
        modes.push( {
          name: 'test-sims-load-only',
          text: 'Test Sims (Load Only)',
          description: 'Runs automated testing that just loads sims (without fuzzing or building)',
          url: '../aqua/test-server/test-sims.html',
          queryParameters: fuzzTestParameter
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
          url: '../' + repo + '/' + repo + '_a11y_view.html',
          queryParameters: devSimQueryParameters.concat( simQueryParameters )
        } );
      }

      if ( repo === 'interaction-dashboard' ) {
        modes.push( {
          name: 'preprocessor',
          text: 'Preprocessor',
          description: 'Load the preprocessor for parsing data logs down to a size that can be used by the simulation.',
          url: '../' + repo + '/preprocessor.html',
          queryParameters: [ {
            value: 'ea',
            text: 'Enable Assertions',
            default: true
          }, {
            value: 'parseX=10',
            text: 'Test only 10 sessions',
            default: false
          }, {
            value: 'cacheBust',
            text: 'Do not cache the log file information',
            default: false
          }, {
            value: 'forSpreadsheet',
            text: 'Create output for a spreasheet.',
            default: false
          } ]
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

      // if a phet-io sim, then add the wrappers to them
      if ( isPhetio ) {

        // Add the console logging, not a wrapper but nice to have
        modes.push( {
          name: 'one-sim-wrapper-tests',
          text: 'Wrapper Unit Tests',
          group: 'PhET-iO',
          description: 'Test the PhET-iO API for this sim.',
          url: '../phet-io-wrappers/phet-io-wrappers-tests.html?sim=' + repo,
          queryParameters: phetioWrapperQueryParameters
        } );

        // Add a link to the compiled wrapper index;
        modes.push( {
          name: 'compiled-index',
          text: 'Compiled Index',
          group: 'PhET-iO',
          description: 'Runs the PhET-iO wrapper index from build/ directory (built from chipper)',
          url: '../' + repo + '/build/phet-io/',
          queryParameters: phetioWrapperQueryParameters
        } );

        modes.push( {
          name: 'standalone',
          text: 'Standalone',
          group: 'PhET-iO',
          description: 'Runs the sim in phet-io brand with the standalone query parameter',
          url: '../' + repo + '/' + repo + '_en.html?brand=phet-io&phetioStandalone',
          queryParameters: phetioSimQueryParameters.concat( simQueryParameters )
        } );

        // phet-io wrappers
        wrappers.forEach( function( wrapper ) {

          var wrapperName = getWrapperName( wrapper );

          var url = '';

          // Process for dedicated wrapper repos
          if ( wrapper.indexOf( 'phet-io-wrapper-' ) === 0 ) {

            // Special use case for the sonification wrapper
            url = wrapperName === 'sonification' ? '../phet-io-wrapper-' + wrapperName + '/' + repo + '-sonification.html?sim=' + repo :
                  '../' + wrapper + '/?sim=' + repo;
          }
          // Load the wrapper urls for the phet-io-wrappers/
          else {
            url = '../' + wrapper + '/?sim=' + repo;
          }

          // add recording to the console by default
          if ( wrapper === 'phet-io-wrappers/record' ) {
            url += '&console';
          }

          modes.push( {
            name: wrapperName,
            text: wrapperName,
            group: 'PhET-iO',
            description: 'Runs the phet-io wrapper ' + wrapperName,
            url: url,
            queryParameters: phetioWrapperQueryParameters
          } );
        } );

        // Add the console logging, not a wrapper but nice to have
        modes.push( {
          name: 'colorized',
          text: 'console: colorized',
          group: 'PhET-iO',
          description: 'Show the colorized event log in the console of the stand alone sim.',
          url: '../' + repo + '/' + repo + '_en.html?brand=phet-io&phetioConsoleLog=colorized&phetioStandalone&phetioEmitHighFrequencyEvents=false',
          queryParameters: phetioSimQueryParameters.concat( simQueryParameters )
        } );
      }
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
        return select.value;
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

        var groups = {};
        modeData[ repositorySelector.value ].forEach( function( choice ) {
          var choiceOption = document.createElement( 'option' );
          choiceOption.value = choice.name;
          choiceOption.label = choice.text;
          choiceOption.title = choice.description;
          choiceOption.innerHTML = choice.text;

          // add to an `optgroup` instead of having all modes on the `select`
          choice.group = choice.group || 'General';

          // create if the group doesn't exist
          if ( !groups[ choice.group ] ) {
            var optGroup = document.createElement( 'optgroup' );
            optGroup.label = choice.group;
            groups[ choice.group ] = optGroup;
            select.appendChild( optGroup );
          }

          // add the choice to the propert group
          groups[ choice.group ].appendChild( choiceOption );
        } );

        select.setAttribute( 'size', modeData[ repositorySelector.value ].length + Object.keys( groups ).length );
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
        var usefulCheckboxes = _.filter( checkboxes, function( checkbox ) {

          // if a checkbox isn't checked, then we only care if it has been changed and is a boolean
          if ( checkbox.dataset.queryParameterType === 'boolean' ) {
            return checkbox.dataset.changed === 'true';
          }
          else {
            return checkbox.checked;
          }
        } );
        var checkboxQueryParameters = _.map( usefulCheckboxes, function( checkbox ) {

          // support boolean parameters
          if ( checkbox.dataset.queryParameterType === 'boolean' ) {
            return checkbox.name + '=' + checkbox.checked;
          }
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
          var checkbox = document.createElement( 'input' );
          checkbox.type = 'checkbox';
          checkbox.name = parameter.value;
          label.appendChild( checkbox );
          label.appendChild( document.createTextNode( parameter.text + ' (' + parameter.value + ')' ) );
          toggleContainer.appendChild( label );
          toggleContainer.appendChild( document.createElement( 'br' ) );
          checkbox.checked = !!parameter.default;

          // mark changed events for boolean parameter support
          checkbox.addEventListener( 'change', function() {
            checkbox.dataset.changed = 'true';
          } );
          checkbox.dataset.queryParameterType = parameter.type;
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
   * Create the view and hook everything up.
   *
   * @param {Object} modeData - Maps from {string} repository name => {Mode}
   */
  function render( modeData ) {
    var repositorySelector = createRepositorySelector( Object.keys( modeData ) );
    var modeSelector = createModeSelector( modeData, repositorySelector );
    var queryParameterSelector = createQueryParameterSelector( modeSelector );

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
    modeSelector.element.addEventListener( 'change', onModeChanged );
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

  // Splits file strings (such as perennial/data/active-runnables) into a list of entries, ignoring blank lines.
  function whiteSplit( str ) {
    return str.split( '\n' ).map( function( line ) {
      return line.replace( '\r', '' );
    } ).filter( function( line ) {
      return line.length > 0;
    } );
  }

  // Load files serially, populate then render
  $.ajax( {
    url: '../perennial/data/active-runnables'
  } ).done( function( activeRunnablesString ) {
    var activeRunnables = whiteSplit( activeRunnablesString );

    $.ajax( {
      url: '../perennial/data/active-repos'
    } ).done( function( activeReposString ) {
      var activeRepos = whiteSplit( activeReposString );

      $.ajax( {
        url: '../perennial/data/phet-io'
      } ).done( function( testPhetioString ) {
        var phetioSims = whiteSplit( testPhetioString );

        $.ajax( {
          url: '../perennial/data/accessibility'
        } ).done( function( accessibleSimsString ) {
          var accessibleSims = whiteSplit( accessibleSimsString );

          $.ajax( {
            url: '../chipper/data/wrappers'
          } ).done( function( wrappersString ) {
            var wrappers = whiteSplit( wrappersString ).sort();

            $.ajax( {
              url: '../perennial/data/color-profiles'
            } ).done( function( colorProfilesString ) {
              var colorProfileRepos = whiteSplit( colorProfilesString ).sort();

              $.ajax( {
                url: '../perennial/data/unit-tests'
              } ).done( function( unitTestsStrings ) {
                var unitTestsRepos = whiteSplit( unitTestsStrings ).sort();

                render( populate( activeRunnables, activeRepos, phetioSims, accessibleSims, wrappers, colorProfileRepos, unitTestsRepos ) );
              } );
            } );
          } );
        } );
      } );
    } );
  } );

} )();
