// Copyright 2016-2023, University of Colorado Boulder

/*
 * Page for quickly launching phet-related tasks, such as simulations, automated/unit tests, or other utilities.
 *
 * Displays three columns. See type information below for details:
 *
 * - Repositories: A list of repositories to select from, each one of which has a number of modes.
 * - Modes: Based on the repository selected. Decides what type of URL is loaded when "Launch" or the enter key is
 *          pressed.
 * - Query Parameters: If available, controls what optional query parameters will be added to the end of the URL.
 */

( async function(): Promise<void> {

  // QueryParameter has the format
  type PhetmarksQueryParameter = {
    value: string; // The actual query parameter included in the URL,
    text: string; // Display string shown in the query parameter list,

    // defaults to flag. If boolean, then it will add "=true" or "=false" to the checkbox value, If parameterValues, must
    // provide "parameterValues" key, where first one is the default.
    type?: 'flag' | 'boolean' | 'parameterValues';
    default?: boolean; // If true, the query parameter will be included by default. This will be false if not provided
    dependentQueryParameters?: PhetmarksQueryParameter[];

    // For type 'parameterValues'
    parameterValues?: string[]; // values of the parameter.
    omitIfDefault?: boolean; // if true, omit the default selection of the query parameter, only adding it when changed. Defaults to false
  };

  type RepoName = string; // the name of a repo;

  type MigrationData = {
    sim: string;
    version: string;
  };

  // "General" is the default
  type ModeGroup = 'PhET-iO' | 'General';

  // Mode has the format
  type Mode = {
    name: string; // Internal unique value (for looking up which option was chosen),
    text: string; // Shown in the mode list
    group?: ModeGroup; // The optgroup that this mode belongs to, defaults to "General"
    description: string; // Shown when hovering over the mode in the list,
    url: string; // The base URL to visit (without added query parameters) when the mode is chosen,
    queryParameters?: PhetmarksQueryParameter[];
  };
  type ModeData = Record<RepoName, Mode[]>;
  type RepoSelector = {
    element: HTMLSelectElement;
    get value(): string;
  };

  type ModeSelector = {
    element: HTMLSelectElement;
    value: string;
    mode: Mode;
    update: () => void;
  };

  type QueryParameterSelector = {
    element: HTMLElement;
    value: string; // The single queryString, like `screens=1`, or '' if nothing should be added to the query string.
  };

  type QueryParametersSelector = {
    toggleElement: HTMLElement;
    customElement: HTMLElement;

    // Get the current queryString value based on the current selection.
    value: string;
    update: () => void;
  };

  type ElementToParameterMap = Map<HTMLElement, PhetmarksQueryParameter>;

  // Query parameters used for the following modes: requirejs, compiled, production
  const simQueryParameters: PhetmarksQueryParameter[] = [
    {
      value: 'audio',
      text: 'Audio support for the runtime',
      type: 'parameterValues',
      parameterValues: [ 'enabled', 'disabled', 'muted' ],
      omitIfDefault: true
    }, {
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
    }, {
      value: 'screens',
      text: 'What sim screen to display',
      type: 'parameterValues',
      parameterValues: [ 'all', '1', '2', '3', '4', '5', '6' ],
      omitIfDefault: true
    } ];

  const eaObject: PhetmarksQueryParameter = { value: 'ea', text: 'Assertions', default: true };

  // Query parameters used for requirejs and PhET-iO wrappers
  const devSimQueryParameters: PhetmarksQueryParameter[] = [
    { value: 'brand=phet', text: 'PhET Brand', default: true },
    eaObject,
    { value: 'eall', text: 'All Assertions' }
  ];

  // TODO: support 'text' for parameterValues https://github.com/phetsims/phetmarks/issues/44
  const phetioElementsDisplayParameter: PhetmarksQueryParameter = {
    value: 'phetioElementsDisplay',
    text: 'What PhET-iO Elements to show',
    type: 'parameterValues',
    parameterValues: [ 'all', 'featured' ]
  };

  const phetioBaseParameters: PhetmarksQueryParameter[] = [ {
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
    text: 'Enables keyboard cycling through the locales',
    default: true
  }, {
    value: 'phetioValidation',
    text: 'if stricter PhET-iO validation is enabled',
    type: 'parameterValues',
    parameterValues: [ 'Simulation Default', 'true', 'false' ],
    omitIfDefault: true
  } ];

  const testServerNoTestTaskQueryParameters: PhetmarksQueryParameter[] = [
    {
      value: 'loadTimeout=30000',
      text: 'how long the test has to load.',
      default: true
    }, {
      value: 'randomize',
      text: 'Randomize sim list'
    }
  ];
  const testServerQueryParameters: PhetmarksQueryParameter[] = testServerNoTestTaskQueryParameters.concat( {
    value: 'testTask=true',
    text: 'test fuzzing after loading, set to false if you just want to test loading',
    default: true
  } );

  // See perennial-alias/data/wrappers for format
  const nonPublishedPhetioWrappersToAddToPhetmarks = [ 'phet-io-wrappers/mirror-inputs' ];

  const phetioDebugTrueParameter: PhetmarksQueryParameter = {
    value: 'phetioDebug=true',
    text: 'Enable assertions for the sim inside a wrapper, basically the phet-io version of ?ea',
    default: true
  };

  // Query parameters for the PhET-iO wrappers (including iframe tests)
  const phetioWrapperQueryParameters: PhetmarksQueryParameter[] = phetioBaseParameters.concat( [ phetioDebugTrueParameter, {
    value: 'phetioWrapperDebug=true',
    text: 'Enable assertions for wrapper-code, like assertions in Studio, State, or Client',
    default: true
  } ] );

  // For phetio sim frame links
  const phetioSimQueryParameters: PhetmarksQueryParameter[] = phetioBaseParameters.concat( [
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

  const migrationQueryParameters: PhetmarksQueryParameter[] = [ ...phetioWrapperQueryParameters, phetioElementsDisplayParameter ];

  /**
   * Returns a local-storage key that has additional information included, to prevent collision with other applications (or in the future, previous
   * versions of phetmarks).
   */
  function storageKey( key: string ): string {
    return `phetmarks-${key}`;
  }

  /**
   * From the wrapper path in perennial-alias/data/wrappers, get the name of the wrapper.
   */
  const getWrapperName = function( wrapper: string ): string {

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

  function openURL( url: string ): void {
    if ( shiftPressed ) {
      window.open( url, '_blank' );
    }
    else {

      // @ts-expect-error - the browser supports setting to a string.
      window.location = url;
    }
  }

  /**
   * Fills out the modeData map with information about repositories, modes and query parameters. Parameters are largely
   * repo lists from perennial-alias/data files.
   *
   */
  function populate( activeRunnables: RepoName[], activeRepos: RepoName[], phetioSims: RepoName[],
                     interactiveDescriptionSims: RepoName[], wrappers: string[],
                     unitTestsRepos: RepoName[], phetioHydrogenSims: MigrationData[] ): ModeData {
    const modeData: ModeData = {};

    activeRepos.forEach( ( repo: RepoName ) => {
      const modes: Mode[] = [];
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
          text: 'Dev (bayes)',
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

      if ( repo === 'phet-io' ) {
        modes.push( {
          name: 'test-studio-sims',
          text: 'Fuzz Test Studio Wrapper',
          description: 'Runs automated testing with fuzzing on studio, 15 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: testServerQueryParameters.concat( [ {
            value: `testDuration=15000&fuzz&wrapperName=studio&wrapperContinuousTest==%7B%7D&testSims=${phetioSims.join( ',' )}`,
            text: 'Fuzz Test PhET-IO sims',
            default: true
          } ] )
        } );
        modes.push( {
          name: 'test-migration-sims',
          text: 'Fuzz Test Migration',
          description: 'Runs automated testing with fuzzing on studio, 10 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: testServerQueryParameters.concat( migrationQueryParameters ).concat( [ {
            value: 'testDuration=20000&fuzz&wrapperName=migration&wrapperContinuousTest=%7B%7D&migrationRate=2000&' +
                   `phetioMigrationReport=assert&testSims=${phetioHydrogenSims.map( simData => simData.sim ).join( ',' )}`,
            text: 'Fuzz Test PhET-IO sims',
            default: true
          } ] )
        } );
        modes.push( {
          name: 'test-state-sims',
          text: 'Fuzz Test State Wrapper',
          description: 'Runs automated testing with fuzzing on state, 15 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: testServerQueryParameters.concat( [ {
            value: `testDuration=15000&fuzz&wrapperName=state&setStateRate=3000&wrapperContinuousTest=%7B%7D&testSims=${phetioSims.join( ',' )}`,
            text: 'Fuzz Test PhET-IO sims',
            default: true
          } ] )
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
            { value: 'brand=phet-io', text: 'PhET-iO Brand', default: repo === 'phet-io' || repo === 'tandem' || repo === 'phet-io-wrappers' },
            ...( repo === 'phet-io-wrappers' ? [ { value: 'sim=gravity-and-orbits', text: 'neededTestParams', default: true } ] : [] )
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
        const generalTestServerSimParams = 'ea&audio=disabled&testDuration=10000';

        modes.push( {
          name: 'test-phet-sims',
          text: 'Fuzz Test PhET Sims',
          description: 'Runs automated testing with fuzzing, 10 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: testServerQueryParameters.concat( [ {
            value: `${generalTestServerSimParams}&brand=phet&fuzz`,
            text: 'Test PhET sims',
            default: true
          } ] )
        } );
        modes.push( {
          name: 'test-phet-io-sims',
          text: 'Fuzz Test PhET-iO Sims',
          description: 'Runs automated testing with fuzzing, 10 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: testServerQueryParameters.concat( [ {
            value: `${generalTestServerSimParams}&brand=phet-io&fuzz&phetioStandalone&testSims=${phetioSims.join( ',' )}`,
            text: 'Fuzz Test PhET-IO sims',
            default: true
          } ] )
        } );
        modes.push( {
          name: 'test-interactive-description-sims',
          text: 'Fuzz Test Interactive Description Sims',
          description: 'Runs automated testing with fuzzing, 10 second timer',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: ( [ {
            value: `${generalTestServerSimParams}&brand=phet&fuzzBoard&supportsInteractiveDescription=true`,
            text: 'Keyboard Fuzz Test sims',
            default: true
          }, {
            value: `${generalTestServerSimParams}&brand=phet&fuzz&supportsInteractiveDescription=true`,
            text: 'Normal Fuzz Test sims',
            default: false
          } ] as PhetmarksQueryParameter[] ).concat( testServerQueryParameters ).concat( [ {
            value: `testSims=${interactiveDescriptionSims.join( ',' )}`,
            text: 'Test only A11y sims',
            default: true
          } ] )
        } );
        modes.push( {
          name: 'fuzz-sims-load-only',
          text: 'Fuzz Sims (Load Only)',
          description: 'Runs automated testing that just loads sims (without fuzzing or building)',
          url: '../aqua/fuzz-lightyear/',
          queryParameters: ( [ {
            value: 'ea&brand=phet&audio=disabled&testTask=false',
            text: 'Test Sims (Load Only)',
            default: true
          } ] as PhetmarksQueryParameter[] ).concat( testServerNoTestTaskQueryParameters )
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

          // Each sim gets its own test, just run sim-less tests here
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
          if ( wrapper.startsWith( 'phet-io-wrapper-' ) ) {

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

          let queryParameters: PhetmarksQueryParameter[] = [];
          if ( wrapperName === 'studio' ) {

            const studioQueryParameters = [ ...phetioWrapperQueryParameters ];

            // Studio defaults to phetioDebug=true, so this parameter doesn't make sense
            _.remove( studioQueryParameters, item => item === phetioDebugTrueParameter );

            queryParameters = studioQueryParameters.concat( [ {
              value: 'phetioDebug=false',
              text: 'Disable assertions for the sim inside Studio. Studio defaults to phetioDebug=true',
              default: false
            }, phetioElementsDisplayParameter ] );
          }
          else if ( wrapperName === 'migration' ) {
            queryParameters = [ ...migrationQueryParameters, {
              value: 'phetioMigrationReport',
              type: 'parameterValues',
              text: 'How should the migration report be reported?',
              parameterValues: [ 'dev', 'client', 'verbose', 'assert' ],
              omitIfDefault: false
            } ];
          }
          else if ( wrapperName === 'state' ) {
            queryParameters = [ ...phetioWrapperQueryParameters, {
              value: 'setStateRate=1000',
              text: 'Customize the "set state" rate for how often a state is set to the downstream sim (in ms)',
              default: true
            }, {
              value: 'logTiming',
              text: 'Console log the amount of time it took to set the state of the simulation.',
              default: false
            } ];
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

  function clearChildren( element: HTMLElement ): void {
    while ( element.childNodes.length ) { element.removeChild( element.childNodes[ 0 ] ); }
  }

  function createRepositorySelector( repositories: RepoName[] ): RepoSelector {
    const select = document.createElement( 'select' );
    select.autofocus = true;
    repositories.forEach( repo => {
      const option = document.createElement( 'option' );
      option.value = option.label = option.innerHTML = repo;
      select.appendChild( option );
    } );

    // IE or no-scrollIntoView will need to be height-limited
    // @ts-expect-error
    if ( select.scrollIntoView && !navigator.userAgent.includes( 'Trident/' ) ) {
      select.setAttribute( 'size', `${repositories.length}` );
    }
    else {
      select.setAttribute( 'size', '30' );
    }

    // Select a repository if it's been stored in localStorage before
    const repoKey = storageKey( 'repo' );
    const value = localStorage.getItem( repoKey );
    if ( value ) {
      select.value = value;
    }

    select.focus();

    // Scroll to the selected element
    function tryScroll(): void {
      const element = select.childNodes[ select.selectedIndex ] as HTMLElement;

      // @ts-expect-error
      if ( element.scrollIntoViewIfNeeded ) {
        // @ts-expect-error
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
        // @ts-expect-error - it is an HTMLElement, not just a node
        return select.childNodes[ select.selectedIndex ].value;
      }
    };
  }

  function createModeSelector( modeData: ModeData, repositorySelector: RepoSelector ): ModeSelector {
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

        const groups: Partial<Record<ModeGroup, HTMLOptGroupElement>> = {};
        modeData[ repositorySelector.value ].forEach( ( choice: Mode ) => {
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

          // add the choice to the property group
          groups[ choice.group ]!.appendChild( choiceOption );
        } );

        select.setAttribute( 'size', modeData[ repositorySelector.value ].length + Object.keys( groups ).length + '' );
        if ( select.selectedIndex < 0 ) {
          select.selectedIndex = 0;
        }
      }
    };

    return selector;
  }

  // Create control for type 'parameterValues'
  function createParameterValuesSelector( queryParameter: PhetmarksQueryParameter ): QueryParameterSelector {
    assert && assert( queryParameter.type === 'parameterValues', `valueValues type only please: ${queryParameter.value} - ${queryParameter.type}` );
    assert && assert( queryParameter.parameterValues, 'parameterValues expected' );
    assert && assert( queryParameter.parameterValues!.length > 0, 'parameterValues expected (more than 0 of them)' );
    assert && assert( !queryParameter.hasOwnProperty( 'dependentQueryParameters' ),
      'type=parameterValues does not support dependent query parameters at this time' );
    assert && assert( !queryParameter.hasOwnProperty( 'default' ),
      'type=parameterValues does not need the default key, instead it is just the first item in the ' +
      'parameterValues list. Also see omitIfDefault' );

    const div = document.createElement( 'div' );
    const queryParameterName = queryParameter.value;
    const parameterValues = queryParameter.parameterValues!;
    const defaultValue = parameterValues[ 0 ];

    const createParameterValuesRadioButton = ( value: string ): HTMLElement => {
      const label = document.createElement( 'label' );
      label.className = 'choiceLabel';
      const radio = document.createElement( 'input' );
      radio.type = 'radio';
      radio.name = queryParameterName;
      radio.value = value;
      radio.checked = value === defaultValue;
      label.appendChild( radio );
      label.appendChild( document.createTextNode( value ) ); // use the query parameter value as the display text for clarity
      return label;
    };

    const label = document.createTextNode( `• ${queryParameterName}=` );
    div.appendChild( label );
    for ( let i = 0; i < parameterValues.length; i++ ) {
      div.appendChild( createParameterValuesRadioButton( parameterValues[ i ] ) );
    }

    const explanation = document.createTextNode( `– ${queryParameter.text}` );
    div.appendChild( explanation );

    return {
      element: div,
      get value() {
        const radioButtonValue = $( `input[name=${queryParameterName}]:checked` ).val() + '';
        return queryParameter.omitIfDefault && radioButtonValue === defaultValue ? '' :
               `${queryParameterName}=${radioButtonValue}`;
      }
    };
  }

  // Boolean and flag checkboxes, but only if they are different from their default
  function getFlagAndBooleanParameters( toggleContainer: HTMLElement ): string[] {

    const checkboxElements = $( toggleContainer ).find( '.flagOrBooleanParameter' )! as unknown as HTMLInputElement[];

    // Only changed checkboxes, not with default values
    return _.filter( checkboxElements, ( checkbox: HTMLInputElement ) => {

      // if a checkbox isn't checked, then we only care if it has been changed and is a boolean
      if ( checkbox.dataset.queryParameterType === 'boolean' ) {
        return checkbox.dataset.changed === 'true';
      }
      else {
        return checkbox.checked;
      }
    } ).map( ( checkbox: HTMLInputElement ) => {

      // support boolean parameters
      if ( checkbox.dataset.queryParameterType === 'boolean' ) {
        return `${checkbox.name}=${checkbox.checked}`;
      }
      return checkbox.name;
    } );
  }

  function createFlagBooleanSelector( parameter: PhetmarksQueryParameter, toggleContainer: HTMLElement,
                                      elementToQueryParameter: ElementToParameterMap ): void {
    assert && assert( !parameter.hasOwnProperty( 'parameterValues' ), 'parameterValues are for type=parameterValues' );
    assert && assert( !parameter.hasOwnProperty( 'omitIfDefault' ), 'omitIfDefault are for type=parameterValues' );

    const label = document.createElement( 'label' );
    const checkbox = document.createElement( 'input' );
    checkbox.type = 'checkbox';
    checkbox.name = parameter.value;
    checkbox.classList.add( 'flagOrBooleanParameter' );
    label.appendChild( checkbox );
    assert && assert( !elementToQueryParameter.has( checkbox ), 'sanity check for overwriting' );
    elementToQueryParameter.set( checkbox, parameter );

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
       */
      const createDependentCheckbox = ( label: string, value: string, checked: boolean ): HTMLDivElement => {
        const dependentQueryParametersContainer = document.createElement( 'div' );

        const dependentCheckbox = document.createElement( 'input' );
        dependentCheckbox.id = getDependentParameterControlId( value );
        dependentCheckbox.type = 'checkbox';
        dependentCheckbox.name = value;
        dependentCheckbox.classList.add( 'flagOrBooleanParameter' );
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
  }

  function createQueryParametersSelector( modeSelector: ModeSelector ): QueryParametersSelector {

    const customTextBox = document.createElement( 'input' );
    customTextBox.type = 'text';

    const toggleContainer = document.createElement( 'div' );

    let elementToQueryParameter: ElementToParameterMap = new Map();
    const parameterValuesSelectors: QueryParameterSelector[] = [];

    return {
      toggleElement: toggleContainer,
      customElement: customTextBox,
      get value() {

        // Boolean and flag query parameters, in string form
        const flagAndBooleanQueryParameters = getFlagAndBooleanParameters( toggleContainer );
        const parameterValuesQueryParameters = parameterValuesSelectors
          .map( ( selector: QueryParameterSelector ) => selector.value )
          .filter( ( queryParameter: string ) => queryParameter !== '' );

        const customQueryParameters = customTextBox.value.length ? [ customTextBox.value ] : [];

        return flagAndBooleanQueryParameters.concat( parameterValuesQueryParameters ).concat( customQueryParameters ).join( '&' );
      },
      update: function() {
        // Rebuild based on a new mode/repo change

        elementToQueryParameter = new Map();
        parameterValuesSelectors.length = 0;
        clearChildren( toggleContainer );

        const queryParameters = modeSelector.mode.queryParameters || [];
        queryParameters.forEach( parameter => {
          if ( parameter.type === 'parameterValues' ) {
            const selector = createParameterValuesSelector( parameter );
            toggleContainer.appendChild( selector.element );
            parameterValuesSelectors.push( selector );
          }
          else {
            createFlagBooleanSelector( parameter, toggleContainer, elementToQueryParameter );
          }
        } );
      }
    };
  }

  /**
   * Create the view and hook everything up.
   */
  function render( modeData: ModeData ): void {
    const repositorySelector = createRepositorySelector( Object.keys( modeData ) );
    const modeSelector = createModeSelector( modeData, repositorySelector );
    const queryParameterSelector = createQueryParametersSelector( modeSelector );

    function getCurrentURL(): string {
      const queryParameters = queryParameterSelector.value;
      const url = modeSelector.mode.url;
      const separator = url.includes( '?' ) ? '&' : '?';
      return url + ( queryParameters.length ? separator + queryParameters : '' );
    }

    const launchButton = document.createElement( 'button' );
    launchButton.id = 'launchButton';
    launchButton.name = 'launch';
    launchButton.innerHTML = 'Launch';

    const resetButton = document.createElement( 'button' );
    resetButton.name = 'reset';
    resetButton.innerHTML = 'Reset Query Parameters';

    function header( string: string ): HTMLElement {
      const head = document.createElement( 'h3' );
      head.appendChild( document.createTextNode( string ) );
      return head;
    }

    // Divs for our three columns
    const repoDiv = document.createElement( 'div' );
    repoDiv.id = 'repositories';
    const modeDiv = document.createElement( 'div' );
    modeDiv.id = 'choices';
    const queryParametersDiv = document.createElement( 'div' );
    queryParametersDiv.id = 'queryParameters';

    // Layout of all the major elements
    repoDiv.appendChild( header( 'Repositories' ) );
    repoDiv.appendChild( repositorySelector.element );
    modeDiv.appendChild( header( 'Modes' ) );
    modeDiv.appendChild( modeSelector.element );
    modeDiv.appendChild( document.createElement( 'br' ) );
    modeDiv.appendChild( document.createElement( 'br' ) );
    modeDiv.appendChild( launchButton );
    queryParametersDiv.appendChild( header( 'Query Parameters' ) );
    queryParametersDiv.appendChild( queryParameterSelector.toggleElement );
    queryParametersDiv.appendChild( document.createTextNode( 'Query Parameters: ' ) );
    queryParametersDiv.appendChild( queryParameterSelector.customElement );
    queryParametersDiv.appendChild( document.createElement( 'br' ) );
    queryParametersDiv.appendChild( resetButton );
    document.body.appendChild( repoDiv );
    document.body.appendChild( modeDiv );
    document.body.appendChild( queryParametersDiv );

    function updateQueryParameterVisibility(): void {
      queryParametersDiv.style.visibility = modeSelector.mode.queryParameters ? 'inherit' : 'hidden';
    }

    // Align panels based on width
    function layout(): void {
      modeDiv.style.left = `${repositorySelector.element.clientWidth + 20}px`;
      queryParametersDiv.style.left = `${repositorySelector.element.clientWidth + +modeDiv.clientWidth + 40}px`;
    }

    window.addEventListener( 'resize', layout );

    // Hook updates to change listeners
    function onRepositoryChanged(): void {
      modeSelector.update();
      onModeChanged();
    }

    function onModeChanged(): void {
      queryParameterSelector.update();
      updateQueryParameterVisibility();
      layout();
    }

    repositorySelector.element.addEventListener( 'change', onRepositoryChanged );
    modeSelector.element.addEventListener( 'change', onModeChanged );
    onRepositoryChanged();

    // Clicking 'Launch' or pressing 'enter' opens the URL
    function openCurrentURL(): void {
      openURL( getCurrentURL() );
    }

    window.addEventListener( 'keydown', event => {
      // Check for enter key
      if ( event.which === 13 ) {
        openCurrentURL();
      }
    }, false );
    launchButton.addEventListener( 'click', openCurrentURL );

    // Reset by redrawing everything
    resetButton.addEventListener( 'click', queryParameterSelector.update );
  }

  // Splits file strings (such as perennial-alias/data/active-runnables) into a list of entries, ignoring blank lines.
  function whiteSplitAndSort( rawDataList: string ): RepoName[] {
    return rawDataList.split( '\n' ).map( line => {
      return line.replace( '\r', '' );
    } ).filter( line => {
      return line.length > 0;
    } ).sort();
  }

  // get the ID for a checkbox that is "dependent" on another value
  const getDependentParameterControlId = ( value: string ) => `dependent-checkbox-${value}`;

  // Load files serially, populate then render
  const activeRunnables = whiteSplitAndSort( await $.ajax( { url: '../perennial-alias/data/active-runnables' } ) );
  const activeRepos = whiteSplitAndSort( await $.ajax( { url: '../perennial-alias/data/active-repos' } ) );
  const phetioSims = whiteSplitAndSort( await $.ajax( { url: '../perennial-alias/data/phet-io' } ) );
  const interactiveDescriptionSims = whiteSplitAndSort( await $.ajax( { url: '../perennial-alias/data/interactive-description' } ) );
  const wrappers = whiteSplitAndSort( await $.ajax( { url: '../perennial-alias/data/wrappers' } ) );
  const unitTestsRepos = whiteSplitAndSort( await $.ajax( { url: '../perennial-alias/data/unit-tests' } ) );
  const phetioHydrogenSims = await $.ajax( { url: '../perennial-alias/data/phet-io-hydrogen.json' } );

  render( populate( activeRunnables, activeRepos, phetioSims, interactiveDescriptionSims, wrappers, unitTestsRepos, phetioHydrogenSims ) );
} )().catch( ( e: Error ) => {
  throw e;
} );
