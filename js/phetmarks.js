// Copyright 2016-2023, University of Colorado Boulder

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


  // Query parameters used for the following modes: requirejs, compiled, production
  const simQueryParameters = [
    { value: 'audio=disabled', text: 'Mute' },
    {
      value: 'fuzz', text: 'Fuzz', dependentQueryParameters: [
        { value: 'fuzzPointers=2', text: 'Multitouch-fuzz' }
      ]
    },
    { value: 'fuzzBoard', text: 'Keyboard Fuzz' },
    { value: 'debugger', text: 'Debugger', default: true },
    { value: 'deprecationWarnings', text: 'Deprecation Warnings' },
    { value: 'dev', text: 'Dev' },
    { value: 'profiler', text: 'Profiler' },
    { value: 'showPointers', text: 'Pointers' },
    { value: 'showPointerAreas', text: 'Pointer Areas' },
    { value: 'showFittedBlockBounds', text: 'Fitted Block Bounds' },
    { value: 'showCanvasNodeBounds', text: 'CanvasNode Bounds' },
    { value: 'supportsInteractiveDescription', text: 'Supports Interactive Description', default: false, type: 'boolean' },
    { value: 'supportsSound', text: 'Supports Sound', default: false, type: 'boolean' },
    { value: 'supportsExtraSound', text: 'Supports Extra Sound', default: false, type: 'boolean' },
    { value: 'extraSoundInitiallyEnabled', text: 'Extra Sound on by default' },
    { value: 'supportsPanAndZoom', text: 'Supports Pan and Zoom', default: true, type: 'boolean' },
    { value: 'supportsVoicing', text: 'Supports Voicing', default: false, type: 'boolean' },
    { value: 'voicingInitiallyEnabled', text: 'Voicing on by default' },
    { value: 'printVoicingResponses', text: 'console.log() voicing responses' },
    { value: 'interactiveHighlightsInitiallyEnabled', text: 'Interactive Highlights on by default' },
    { value: 'preferencesStorage', text: 'Remember previous values of preferences from localStorage.' },
    { value: 'webgl=false', text: 'No WebGL' },
    { value: 'listenerOrder=random', text: 'Randomize listener order' },
    {
      value: 'locales=*', text: 'Load all locales', dependentQueryParameters: [
        { value: 'keyboardLocaleSwitcher', text: 'ctrl + u/i to cycle locales' }
      ]
    }
  ];

  const eaObject = { value: 'ea', text: 'Assertions', default: true };

  // Query parameters used for requirejs and PhET-iO wrappers
  const devSimQueryParameters = [
    { value: 'brand=phet', text: 'PhET Brand', default: true },
    eaObject,
    { value: 'eall', text: 'All Assertions' }
  ];

  const phetioBaseParameters = [ {
    value: 'phetioEmitHighFrequencyEvents',
    default: true,
    type: 'boolean',
    text: 'Emit events that occur often'
  }, {
    value: 'phetioEmitStates',
    default: false,
    type: 'boolean',
    text: 'Emit states to the data stream'
  }, {
    value: 'phetioCompareAPI&randomSeed=332211', // NOTE: DUPLICATION ALERT: random seed must match that of API generation, see generatePhetioMacroAPI.js
    text: 'Compare with reference API'
  }, {
    value: 'phetioPrintMissingTandems',
    default: false,
    text: 'Print tandems that have not yet been added'
  }, {
    value: 'phetioPrintAPIProblems',
    default: false,
    text: 'Print problems found by phetioAPIValidation to the console instead of asserting each item.'
  }, {
    value: 'locales=*',
    text: 'Loads all the translated versions',
    default: true
  }, {
    value: 'keyboardLocaleSwitcher',
    text: 'Enables keybard cycling through the locales',
    default: true
  } ];

  // See perennial-alias/data/wrappers for format
  const nonPublishedPhetioWrappersToAddToPhetmarks = [ 'phet-io-wrappers/mirror-inputs' ];

  const phetioDebugTrueParameter = {
    value: 'phetioDebug=true',
    text: 'Enable assertions for the sim inside a wrapper, basically the phet-io version of ?ea',
    default: true
  };

  // Query parameters for the PhET-iO wrappers (including iframe tests)
  const phetioWrapperQueryParameters = phetioBaseParameters.concat( [ phetioDebugTrueParameter, {
    value: 'phetioWrapperDebug=true',
    text: 'Enable assertions for wrapper-code, like assertions in Studio, State, or Client',
    default: true
  } ] );

  // For phetio sim frame links
  const phetioSimQueryParameters = phetioBaseParameters.concat( [
    eaObject, // this needs to be first in this list
    { value: 'brand=phet-io&phetioStandalone&phetioConsoleLog=colorized', text: 'Formatted PhET-IO Console Output' }, {
      value: 'phetioPrintMissingTandems',
      default: false,
      text: 'Print tandems that have not yet been added'
    }, {
      value: 'phetioPrintAPIProblems',
      default: false,
      text: 'Print problems found by phetioAPIValidation to the console instead of asserting each item.'
    }, {
      value: 'phetioPrintAPI',
      default: false,
      text: 'Print the API to the console'
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
    return `phetmarks-${key}`;
  }

  /**
   * From the wrapper path in perennial-alias/data/wrappers, get the name of the wrapper.
   * @param {string} wrapper
   * @returns {string} - the name of the wrapper
   */
  const getWrapperName = function( wrapper ) {

    // If the wrapper has its own individual repo, then get the name 'classroom-activity' from 'phet-io-wrapper-classroom-activity'
    // Maintain compatibility for wrappers in 'phet-io-wrappers-'
    const wrapperParts = wrapper.split( 'phet-io-wrapper-' );
    const wrapperName = wrapperParts.length === 1 ? wrapperParts[ 0 ] : wrapperParts[ 1 ];

    // If the wrapper still has slashes in it, then it looks like 'phet-io-wrappers/active'
    const splitOnSlash = wrapperName.split( '/' );
    return splitOnSlash[ splitOnSlash.length - 1 ];
  };

  // Track whether 'shift' key is pressed, so that we can change how windows are opened.  If shift is pressed, the
  // page is launched in a separate tab.
  let shiftPressed = false;
  window.addEventListener( 'keydown', event => {
    shiftPressed = event.shiftKey;
  } );
  window.addEventListener( 'keyup', event => {
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
   * Fills out the modeData map with information about repositories, modes and query parameters. Parameters are largely
   * repo lists from perennial-alias/data files.
   *
   * @param {Array.<string>} activeRunnables - from active-runnables
   * @param {Array.<string>} activeRepos - from active-repos
   * @param {Array.<string>} phetioSims - from phet-io
   * @param {Array.<string>} interactiveDescriptionSims - from interactive-description
   * @param {Array.<string>} wrappers - from wrappers
   * @param {Array.<string>} unitTestsRepos - Has unit tests
   * @returns {Object} - Maps from {string} repository name => {Mode}
   */
  function populate( activeRunnables, activeRepos, phetioSims, interactiveDescriptionSims, wrappers, unitTestsRepos ) {
    const modeData = {};

    activeRepos.forEach( repo => {
      const modes = [];
      modeData[ repo ] = modes;

      const isPhetio = _.includes( phetioSims, repo );
      const hasUnitTests = _.includes( unitTestsRepos, repo );
      const isRunnable = _.includes( activeRunnables, repo );
      const supportsInteractiveDescription = _.includes( interactiveDescriptionSims, repo );

      if ( isRunnable ) {
        modes.push( {
          name: 'requirejs',
          text: 'Unbuilt',
          description: 'Runs the simulation from the top-level development HTML in unbuilt mode',
          url: `../${repo}/${repo}_en.html`,
          queryParameters: devSimQueryParameters.concat( simQueryParameters )
        } );
        modes.push( {
          name: 'compiled',
          text: 'Compiled',
          description: 'Runs the English simulation from the build/phet/ directory (built from chipper)',
          url: `../${repo}/build/phet/${repo}_en_phet.html`,
          queryParameters: simQueryParameters
        } );
        modes.push( {
          name: 'compiledXHTML',
          text: 'Compiled XHTML',
          description: 'Runs the English simulation from the build/phet/xhtml directory (built from chipper)',
          url: `../${repo}/build/phet/xhtml/${repo}_all.xhtml`,
          queryParameters: simQueryParameters
        } );
        modes.push( {
          name: 'production',
          text: 'Production',
          description: 'Runs the latest English simulation from the production server',
          url: `https://phet.colorado.edu/sims/html/${repo}/latest/${repo}_all.html`,
          queryParameters: simQueryParameters
        } );
        modes.push( {
          name: 'spot',
          text: 'Dev (spot)',
          description: 'Loads the location on phet-dev.colorado.edu with versions for each dev deploy',
          url: `https://phet-dev.colorado.edu/html/${repo}`
        } );
      }

      // Color picker UI
      if ( isRunnable ) {
        modes.push( {
          name: 'colors',
          text: 'Color Editor',
          description: 'Runs the top-level -colors.html file (allows editing/viewing different profile colors)',
          url: `color-editor.html?sim=${repo}&brand=phet`
        } );
      }

      if ( repo === 'scenery' ) {
        modes.push( {
          name: 'inspector',
          text: 'Inspector',
          description: 'Displays saved Scenery snapshots',
          url: `../${repo}/tests/inspector.html`
        } );
      }

      if ( hasUnitTests ) {
        modes.push( {
          name: 'unitTestsRequirejs',
          text: 'Unit Tests (unbuilt)',
          description: 'Runs unit tests in unbuilt mode',
          url: `../${repo}/${repo}-tests.html`,
          queryParameters: [
            { value: 'ea', text: 'Assertions', default: true },
            ...( repo === 'phet-io-wrappers' ? [ { value: 'sim=gravity-and-orbits', text: 'addSim', default: true } ] : [] )
          ]
        } );
      }
      if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' || repo === 'phet-io' ) {
        modes.push( {
          name: 'documentation',
          text: 'Documentation',
          description: 'Browse HTML documentation',
          url: `../${repo}/doc/`
        } );
      }
      if ( repo === 'scenery' ) {
        modes.push( {
          name: 'layout-documentation',
          text: 'Layout Documentation',
          description: 'Browse HTML layout documentation',
          url: `../${repo}/doc/layout.html`
        } );
      }
      if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' ) {
        modes.push( {
          name: 'examples',
          text: 'Examples',
          description: 'Browse Examples',
          url: `../${repo}/examples/`
        } );
      }
      if ( repo === 'scenery' || repo === 'kite' || repo === 'dot' || repo === 'phet-core' ) {
        modes.push( {
          name: 'playground',
          text: 'Playground',
          description: `Loads ${repo} and dependencies in the tab, and allows quick testing`,
          url: `../${repo}/tests/playground.html`
        } );
      }
      if ( repo === 'scenery' ) {
        modes.push( {
          name: 'sandbox',
          text: 'Sandbox',
          description: 'Allows quick testing of Scenery features',
          url: `../${repo}/tests/sandbox.html`
        } );
      }
      if ( repo === 'chipper' || repo === 'aqua' ) {
        const generalTestParams = 'ea&audio=disabled&testDuration=10000&testConcurrentBuilds=4';
        const fuzzTestParameter = [ {
          value: `${generalTestParams}&brand=phet&fuzz`,
          text: 'Test PhET sims',
          default: true
        }, {
          value: 'randomize',
          text: 'Randomize sim list'
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
            value: `${generalTestParams}&brand=phet-io&fuzz&phetioStandalone&testSims=${phetioSims.join( ',' )}`,
            text: 'Fuzz Test PhET-IO sims',
            default: true
          }, {
            value: 'randomize',
            text: 'Randomize sim list'
          } ]
        } );
        modes.push( {
          name: 'test-interactive-description-sims',
          text: 'Fuzz Test Interactive Description Sims (Fast Build)',
          description: 'Runs automated testing with fuzzing, 10 second timer, and 4 concurrent builds',
          url: '../aqua/test-server/test-sims.html',
          queryParameters: [ {
            value: `${generalTestParams}&brand=phet&fuzzBoard&supportsInteractiveDescription=true`,
            text: 'Keyboard Fuzz Test sims',
            default: true
          }, {
            value: `${generalTestParams}&brand=phet&fuzz&supportsInteractiveDescription=true`,
            text: 'Normal Fuzz Test sims',
            default: false
          }, {
            value: `testSims=${interactiveDescriptionSims.join( ',' )}`,
            text: 'Test only A11y sims',
            default: true
          }, {
            value: 'randomize',
            text: 'Randomize sim list'
          } ]
        } );
        modes.push( {
          name: 'test-sims-load-only',
          text: 'Test Sims (Load Only)',
          description: 'Runs automated testing that just loads sims (without fuzzing or building)',
          url: '../aqua/test-server/test-sims.html',
          queryParameters: [ {
            value: 'ea&brand=phet&audio=disabled&testTask=false&testBuilt=false',
            text: 'Test Sims (Load Only)',
            default: true
          } ]
        } );
        modes.push( {
          name: 'continuous-testing',
          text: 'Continuous Testing',
          description: 'Link to the continuous testing on Bayes.',
          url: 'https://bayes.colorado.edu/continuous-testing/aqua/html/continuous-report.html'
        } );
        modes.push( {
          name: 'snapshot-comparison',
          text: 'Snapshot Comparison',
          description: 'Sets up snapshot screenshot comparison that can be run on different SHAs',
          url: '../aqua/html/snapshot-comparison.html'
        } );
        modes.push( {
          name: 'multi-snapshot-comparison',
          text: 'Multi-snapshot Comparison',
          description: 'Sets up snapshot screenshot comparison for two different checkouts',
          url: '../aqua/html/multi-snapshot-comparison.html'
        } );
      }
      if ( repo === 'yotta' ) {
        modes.push( {
          name: 'yotta-statistics',
          text: 'Statistics page',
          description: 'Goes to the yotta report page, credentials in the Google Doc',
          url: 'https://bayes.colorado.edu/statistics/yotta/'
        } );
      }
      if ( repo === 'skiffle' ) {
        modes.push( {
          name: 'sound-board',
          text: 'Sound Board',
          description: 'Interactive HTML page for exploring existing sounds in sims and common code',
          url: '../skiffle/html/sound-board.html'
        } );
      }
      if ( repo === 'quake' ) {
        modes.push( {
          name: 'quake-built',
          text: 'Haptics Playground (built for browser)',
          description: 'Built browser version of the Haptics Playground app',
          url: '../quake/platforms/browser/www/haptics-playground.html'
        } );
      }

      if ( supportsInteractiveDescription ) {
        modes.push( {
          name: 'a11y-view',
          text: 'A11y View',
          description: 'Runs the simulation in an iframe next to a copy of the PDOM tot easily inspect accessible content.',
          url: `../${repo}/${repo}_a11y_view.html`,
          queryParameters: devSimQueryParameters.concat( simQueryParameters )
        } );
      }

      if ( repo === 'interaction-dashboard' ) {
        modes.push( {
          name: 'preprocessor',
          text: 'Preprocessor',
          description: 'Load the preprocessor for parsing data logs down to a size that can be used by the simulation.',
          url: `../${repo}/preprocessor.html`,
          queryParameters: [ {
            value: 'ea',
            text: 'Enable Assertions',
            default: true
          }, {
            value: 'parseX=10',
            text: 'Test only 10 sessions',
            default: false
          }, {
            value: 'forSpreadsheet',
            text: 'Create output for a spreadsheet.',
            default: false
          } ]
        } );
      }

      modes.push( {
        name: 'github',
        text: 'GitHub',
        description: 'Opens to the repository\'s GitHub main page',
        url: `https://github.com/phetsims/${repo}`
      } );
      modes.push( {
        name: 'issues',
        text: 'Issues',
        description: 'Opens to the repository\'s GitHub issues page',
        url: `https://github.com/phetsims/${repo}/issues`
      } );

      // if a phet-io sim, then add the wrappers to them
      if ( isPhetio ) {

        // Add the console logging, not a wrapper but nice to have
        modes.push( {
          name: 'one-sim-wrapper-tests',
          text: 'Wrapper Unit Tests',
          group: 'PhET-iO',
          description: 'Test the PhET-iO API for this sim.',
          url: `../phet-io-wrappers/phet-io-wrappers-tests.html?sim=${repo}`,
          queryParameters: phetioWrapperQueryParameters
        } );

        // Add a link to the compiled wrapper index;
        modes.push( {
          name: 'compiled-index',
          text: 'Compiled Index',
          group: 'PhET-iO',
          description: 'Runs the PhET-iO wrapper index from build/ directory (built from chipper)',
          url: `../${repo}/build/phet-io/`,
          queryParameters: phetioWrapperQueryParameters
        } );

        modes.push( {
          name: 'standalone',
          text: 'Standalone',
          group: 'PhET-iO',
          description: 'Runs the sim in phet-io brand with the standalone query parameter',
          url: `../${repo}/${repo}_en.html?brand=phet-io&phetioStandalone`,
          queryParameters: phetioSimQueryParameters.concat( simQueryParameters )
        } );

        // phet-io wrappers
        wrappers.concat( nonPublishedPhetioWrappersToAddToPhetmarks ).sort().forEach( wrapper => {

          const wrapperName = getWrapperName( wrapper );

          let url = '';

          // Process for dedicated wrapper repos
          if ( wrapper.indexOf( 'phet-io-wrapper-' ) === 0 ) {

            // Special use case for the sonification wrapper
            url = wrapperName === 'sonification' ? `../phet-io-wrapper-${wrapperName}/${repo}-sonification.html?sim=${repo}` :
                  `../${wrapper}/?sim=${repo}`;
          }
          // Load the wrapper urls for the phet-io-wrappers/
          else {
            url = `../${wrapper}/?sim=${repo}`;
          }

          // add recording to the console by default
          if ( wrapper === 'phet-io-wrappers/record' ) {
            url += '&console';
          }

          let queryParameters = [];
          if ( wrapperName === 'studio' ) {

            const studioQueryParameters = [ ...phetioWrapperQueryParameters ];

            // Studio defaults to phetioDebug=true, so this parameter doesn't make sense
            _.remove( studioQueryParameters, item => item === phetioDebugTrueParameter );

            queryParameters = studioQueryParameters.concat( [ {
              value: 'phetioDebug=false',
              text: 'Disable assertions for the sim inside Studio. Studio defaults to phetioDebug=true',
              default: false
            }, {
              value: 'phetioElementsDisplay=all',
              text: 'Show all elements',
              default: true
            } ] );
          }
          else if ( wrapperName === 'playback' ) {
            queryParameters = [];
          }
          else {
            queryParameters = phetioWrapperQueryParameters;
          }

          modes.push( {
            name: wrapperName,
            text: wrapperName,
            group: 'PhET-iO',
            description: `Runs the phet-io wrapper ${wrapperName}`,
            url: url,
            queryParameters: queryParameters
          } );
        } );

        // Add the console logging, not a wrapper but nice to have
        modes.push( {
          name: 'colorized',
          text: 'Data: colorized',
          group: 'PhET-iO',
          description: 'Show the colorized event log in the console of the stand alone sim.',
          url: `../${repo}/${repo}_en.html?brand=phet-io&phetioConsoleLog=colorized&phetioStandalone&phetioEmitHighFrequencyEvents=false`,
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
    const select = document.createElement( 'select' );
    select.autofocus = true;
    repositories.forEach( repo => {
      const option = document.createElement( 'option' );
      option.value = option.label = option.innerHTML = repo;
      select.appendChild( option );
    } );

    // IE or no-scrollIntoView will need to be height-limited
    if ( select.scrollIntoView && navigator.userAgent.indexOf( 'Trident/' ) < 0 ) {
      select.setAttribute( 'size', repositories.length );
    }
    else {
      select.setAttribute( 'size', '30' );
    }

    // Select a repository if it's been stored in localStorage before
    const repoKey = storageKey( 'repo' );
    if ( localStorage.getItem( repoKey ) ) {
      select.value = localStorage.getItem( repoKey );
    }

    select.focus();

    // Scroll to the selected element
    function tryScroll() {
      const element = select.childNodes[ select.selectedIndex ];
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
    const select = document.createElement( 'select' );

    const selector = {
      element: select,
      get value() {
        return select.value;
      },
      get mode() {
        const currentModeName = selector.value;
        return _.filter( modeData[ repositorySelector.value ], mode => {
          return mode.name === currentModeName;
        } )[ 0 ];
      },
      update: function() {
        localStorage.setItem( storageKey( 'repo' ), repositorySelector.value );

        clearChildren( select );

        const groups = {};
        modeData[ repositorySelector.value ].forEach( choice => {
          const choiceOption = document.createElement( 'option' );
          choiceOption.value = choice.name;
          choiceOption.label = choice.text;
          choiceOption.title = choice.description;
          choiceOption.innerHTML = choice.text;

          // add to an `optgroup` instead of having all modes on the `select`
          choice.group = choice.group || 'General';

          // create if the group doesn't exist
          if ( !groups[ choice.group ] ) {
            const optGroup = document.createElement( 'optgroup' );
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
    const div = document.createElement( 'div' );

    function createScreenRadioButton( name, value, text ) {
      const label = document.createElement( 'label' );
      label.className = 'screenLabel';
      const radio = document.createElement( 'input' );
      radio.type = 'radio';
      radio.name = name;
      radio.value = value;
      radio.checked = value === 'all';
      label.appendChild( radio );
      label.appendChild( document.createTextNode( text ) );
      return label;
    }

    div.appendChild( createScreenRadioButton( 'screens', 'all', 'All screens' ) );
    for ( let i = 1; i <= 6; i++ ) {
      div.appendChild( createScreenRadioButton( 'screens', `${i}`, `${i}` ) );
    }

    return {
      element: div,
      get value() {
        return $( 'input[name=screens]:checked' ).val();
      },
      reset: function() {
        $( 'input[name=screens]' )[ 0 ].checked = true;
      }
    };
  }

  function createPhetioValidationSelector() {
    const div = document.createElement( 'div' );

    function createValidationRadioButton( name, value, text ) {
      const label = document.createElement( 'label' );
      label.className = 'validationLabel'; // https://github.com/phetsims/tandem/issues/191
      const radio = document.createElement( 'input' );
      radio.type = 'radio';
      radio.name = name;
      radio.value = value;
      radio.checked = value === 'simulation-default';
      label.appendChild( radio );
      label.appendChild( document.createTextNode( text ) );
      return label;
    }

    const span = document.createElement( 'span' );
    span.textContent = 'phetioValidation=';
    div.appendChild( span );
    div.appendChild( createValidationRadioButton( 'validation', 'true', 'true' ) );
    div.appendChild( createValidationRadioButton( 'validation', 'false', 'false' ) );
    div.appendChild( createValidationRadioButton( 'validation', 'simulation-default', 'Simulation Default' ) );

    return {
      element: div,
      get value() {
        return $( 'input[name=validation]:checked' ).val();
      },
      reset: function() {
        $( 'input[name=validation]' )[ 0 ].checked = true;
      }
    };
  }


  /**
   * @param {Object} modeSelector
   * @returns { element: {HTMLSelectElement}, get value(): {string} }
   */
  function createQueryParameterSelector( modeSelector ) {
    const screenSelector = createScreenSelector();
    const phetioValidationSelector = createPhetioValidationSelector();

    const customTextBox = document.createElement( 'input' );
    customTextBox.type = 'text';

    const toggleContainer = document.createElement( 'div' );

    // get the ID for a checkbox that is "dependent" on another value
    const getDependentParameterControlId = value => `dependent-checkbox-${value}`;

    const selector = {
      screenElement: screenSelector.element,
      phetioValidationElement: phetioValidationSelector.element,
      toggleElement: toggleContainer,
      customElement: customTextBox,
      get value() {
        const screensValue = screenSelector.value;
        const checkboxes = $( toggleContainer ).find( ':checkbox' );
        const usefulCheckboxes = _.filter( checkboxes, checkbox => {

          // if a checkbox isn't checked, then we only care if it has been changed and is a boolean
          if ( checkbox.dataset.queryParameterType === 'boolean' ) {
            return checkbox.dataset.changed === 'true';
          }
          else {
            return checkbox.checked;
          }
        } );
        const checkboxQueryParameters = _.map( usefulCheckboxes, checkbox => {

          // support boolean parameters
          if ( checkbox.dataset.queryParameterType === 'boolean' ) {
            return `${checkbox.name}=${checkbox.checked}`;
          }
          return checkbox.name;
        } );
        const customQueryParameters = customTextBox.value.length ? [ customTextBox.value ] : [];
        const screenQueryParameters = screensValue === 'all' ? [] : [ `screens=${screensValue}` ];
        const phetioValidationQueryParameters = phetioValidationSelector.value === 'simulation-default' ? [] :
                                                phetioValidationSelector.value === 'true' ? [ 'phetioValidation=true' ] :
                                                phetioValidationSelector.value === 'false' ? [ 'phetioValidation=false' ] :
                                                'error';
        if ( phetioValidationQueryParameters === 'error' ) {
          throw new Error( 'bad value for phetioValidation' );
        }
        return checkboxQueryParameters.concat( customQueryParameters ).concat( screenQueryParameters ).concat( phetioValidationQueryParameters ).join( '&' );
      },
      update: function() {
        clearChildren( toggleContainer );

        const queryParameters = modeSelector.mode.queryParameters || [];
        queryParameters.forEach( parameter => {
          const label = document.createElement( 'label' );
          const checkbox = document.createElement( 'input' );
          checkbox.type = 'checkbox';
          checkbox.name = parameter.value;
          label.appendChild( checkbox );

          let queryParameterDisplay = parameter.value;

          // should the "=true" if boolean
          if ( parameter.type === 'boolean' ) {
            queryParameterDisplay += `=${parameter.default}`;
          }
          label.appendChild( document.createTextNode( `${parameter.text} (${queryParameterDisplay})` ) );
          toggleContainer.appendChild( label );
          toggleContainer.appendChild( document.createElement( 'br' ) );
          checkbox.checked = !!parameter.default;

          if ( parameter.dependentQueryParameters ) {

            /**
             * Creates a checkbox whose value is dependent on another checkbox, it is only used if the parent
             * checkbox is checked.
             * @param {string} label
             * @param {string} value
             * @param {boolean} checked - initial checked state
             * @returns {HTMLDivElement}
             */
            const createDependentCheckbox = ( label, value, checked ) => {
              const dependentQueryParametersContainer = document.createElement( 'div' );

              const dependentCheckbox = document.createElement( 'input' );
              dependentCheckbox.id = getDependentParameterControlId( value );
              dependentCheckbox.type = 'checkbox';
              dependentCheckbox.name = value;
              dependentCheckbox.style.marginLeft = '40px';
              dependentCheckbox.checked = checked;
              const labelElement = document.createElement( 'label' );
              labelElement.appendChild( document.createTextNode( label ) );
              labelElement.htmlFor = dependentCheckbox.id;

              dependentQueryParametersContainer.appendChild( dependentCheckbox );
              dependentQueryParametersContainer.appendChild( labelElement );

              // checkbox becomes unchecked and disabled if dependency checkbox is unchecked
              const enableButton = () => {
                dependentCheckbox.disabled = !checkbox.checked;
                if ( !checkbox.checked ) {
                  dependentCheckbox.checked = false;
                }
              };
              checkbox.addEventListener( 'change', enableButton );
              enableButton();

              return dependentQueryParametersContainer;
            };

            const containerDiv = document.createElement( 'div' );
            parameter.dependentQueryParameters.forEach( relatedParameter => {
              const dependentCheckbox = createDependentCheckbox( `${relatedParameter.text} (${relatedParameter.value})`, relatedParameter.value, !!relatedParameter.default );
              containerDiv.appendChild( dependentCheckbox );
            } );
            toggleContainer.appendChild( containerDiv );
          }

          // mark changed events for boolean parameter support
          checkbox.addEventListener( 'change', () => {
            checkbox.dataset.changed = 'true';
          } );
          checkbox.dataset.queryParameterType = parameter.type;
        } );
      },
      reset: function() {
        screenSelector.reset();
        phetioValidationSelector.reset();

        customTextBox.value = '';

        // For each checkbox, set it to its default
        _.forEach( $( toggleContainer ).find( ':checkbox' ), checkbox => {

          // Grab the parameter object
          const parameter = _.filter( modeSelector.mode.queryParameters, param => param.value === checkbox.name )[ 0 ];

          if ( parameter ) {

            // Handle when the default isn't defined (it would be false)
            checkbox.checked = !!parameter.default;

            // dependent parameter controls only enabled if parent checkbox is checked
            if ( parameter.dependentQueryParameters ) {
              parameter.dependentQueryParameters.forEach( relatedParam => {
                const dependentCheckbox = document.getElementById( getDependentParameterControlId( relatedParam.value ) );
                dependentCheckbox.disabled = !checkbox.checked;
                dependentCheckbox.checked = !!relatedParam.default;
              } );
            }
          }
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
    const repositorySelector = createRepositorySelector( Object.keys( modeData ) );
    const modeSelector = createModeSelector( modeData, repositorySelector );
    const queryParameterSelector = createQueryParameterSelector( modeSelector );

    function getCurrentURL() {
      const queryParameters = queryParameterSelector.value;
      const url = modeSelector.mode.url;
      const separator = url.indexOf( '?' ) < 0 ? '?' : '&';
      return url + ( queryParameters.length ? separator + queryParameters : '' );
    }

    const launchButton = document.createElement( 'button' );
    launchButton.id = 'launchButton';
    launchButton.name = 'launch';
    launchButton.innerHTML = 'Launch';

    const resetButton = document.createElement( 'button' );
    resetButton.name = 'reset';
    resetButton.innerHTML = 'Reset Query Parameters';

    function header( str ) {
      const head = document.createElement( 'h3' );
      head.appendChild( document.createTextNode( str ) );
      return head;
    }

    // Divs for our three columns
    const repoDiv = document.createElement( 'div' );
    repoDiv.id = 'repositories';
    const modeDiv = document.createElement( 'div' );
    modeDiv.id = 'choices';
    const queryParametersDiv = document.createElement( 'div' );
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
    queryParametersDiv.appendChild( queryParameterSelector.phetioValidationElement );
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
      modeDiv.style.left = `${repositorySelector.element.clientWidth + 20}px`;
      queryParametersDiv.style.left = `${repositorySelector.element.clientWidth + +modeDiv.clientWidth + 40}px`;
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

    window.addEventListener( 'keydown', event => {
      // Check for enter key
      if ( event.which === 13 ) {
        openCurrentURL();
      }
    }, false );
    launchButton.addEventListener( 'click', openCurrentURL );

    // Reset
    resetButton.addEventListener( 'click', queryParameterSelector.reset );
  }

  // Splits file strings (such as perennial-alias/data/active-runnables) into a list of entries, ignoring blank lines.
  function whiteSplitAndSort( str ) {
    return str.split( '\n' ).map( line => {
      return line.replace( '\r', '' );
    } ).filter( line => {
      return line.length > 0;
    } ).sort();
  }

  // Load files serially, populate then render
  $.ajax( {
    url: '../perennial-alias/data/active-runnables'
  } ).done( activeRunnablesString => {
    const activeRunnables = whiteSplitAndSort( activeRunnablesString );

    $.ajax( {
      url: '../perennial-alias/data/active-repos'
    } ).done( activeReposString => {
      const activeRepos = whiteSplitAndSort( activeReposString );

      $.ajax( {
        url: '../perennial-alias/data/phet-io'
      } ).done( testPhetioString => {
        const phetioSims = whiteSplitAndSort( testPhetioString );

        $.ajax( {
          url: '../perennial-alias/data/interactive-description'
        } ).done( accessibleSimsString => {
          const interactiveDescriptionSims = whiteSplitAndSort( accessibleSimsString );

          $.ajax( {
            url: '../perennial-alias/data/wrappers'
          } ).done( wrappersString => {
            const wrappers = whiteSplitAndSort( wrappersString ).sort();

            $.ajax( {
              url: '../perennial-alias/data/unit-tests'
            } ).done( unitTestsStrings => {
              const unitTestsRepos = whiteSplitAndSort( unitTestsStrings ).sort();

              render( populate( activeRunnables, activeRepos, phetioSims, interactiveDescriptionSims, wrappers, unitTestsRepos ) );
            } );
          } );
        } );
      } );
    } );
  } );

} )();
