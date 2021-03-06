
/**
 * imports
 */
import Fs from 'fs';
import Path from 'path';
import Chalk from 'chalk';
import Clear from 'clear';
import _merge from '@onephrase/util/obj/merge.js';
import _all from '@onephrase/util/arr/all.js';
import _isNumeric from '@onephrase/util/js/isNumeric.js';
import Promptx, { initialGetIndex, validateAs, transformAs } from '@onephrase/util/cli/Promptx.js';
import * as DotJson from '@onephrase/util/src/DotJson.js';
import printArgs from '@onephrase/util/cli/printArgs.js';

/**
 * Obtains parameters for initializing a server.
 * 
 * @param string    ROOT
 * @param object    flags
 * @param bool      ellipsis
 * @param object    pkg
 * 
 * @return Promise
 */
export default async function(ROOT, flags, ellipsis, pkg) {
    Clear();
    var _params = {}, _paramsFile;
    if (Fs.existsSync(_paramsFile = Path.join(ROOT, flags['CONFIG'] || './.navigator/manifest.config.json'))) {
        _params = DotJson.read(_paramsFile);
    }
    // -------------------
    // Create server parameters
    // -------------------
    var params = _merge({
        ROOT,
        PUBLIC_DIR: './public',
        // -----------------
        MANIFEST_NAME: pkg.value,
        MANIFEST_SHORT_NAME: pkg.value,
        MANIFEST_DESCRIPTION: pkg.description,
        MANIFEST_CATEGORIES: pkg.keywords,
        MANIFEST_THEME_COLOR: 'transparent',
        MANIFEST_BACKGROUND_COLOR: 'transparent',
        MANIFEST_ICONS: [],
        MANIFEST_DISPLAY: 'browser',
        MANIFEST_ORIENTATION: 'any',
        // advanced
        MANIFEST_SCREENSHOTS: [],
        MANIFEST_SHORTCUTS: [],
        MANIFEST_SCOPE: '/',
        MANIFEST_START_URL: '/',
        MANIFEST_LANG: 'en-us',
        MANIFEST_DIR: 'ltr',
        MANIFEST_RELATED_APPLICATIONS: '',
        MANIFEST_PREFER_RELATED_APPLICATIONS: false,
    }, _params, flags);

    // Choices hash...
    const choices = {
        display: [
            {value: 'browser',},
            {value: 'fullscreen',},
            {value: 'standalone',}, 
            {value: 'minimal-ui',},
        ],
        orientation: [
            {value: 'any',},
            {value: 'natural',},
            {value: ':::::::::::::::::', disabled:true,},
            {value: 'landscape',},
            {value: 'landscape-primary',},
            {value: 'landscape-secondary',},
            {value: ':::::::::::::::::', disabled:true,},
            {value: 'portrait',},
            {value: 'portrait-primary',},
            {value: 'portrait-secondary',},
        ],
    };
    // Gets index...
    const getSize = src => Path.basename(src).split(/[_\.\-]/g).reduce((size, chunk) => size || (_all(chunk.split('x'), c => _isNumeric(c)) ? chunk : ''), null);
    const getMime = src => extensions[Path.extname(src)];
    // extensions
    const extensions = {
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.jpeg': 'image/jpeg',
        '.ico': 'image/ico',
    };
    
    if (ellipsis) {
        var questions = [
            {
                name: 'PUBLIC_DIR',
                type: 'text',
                message: 'Enter the directory for static files:',
                initial: params.PUBLIC_DIR,
                format: transformAs(['path']),
                validate: validateAs(['input', 'important']),
            },
            {
                name: 'MANIFEST_NAME',
                type: 'text',
                message: 'Enter the application name:',
                initial: params.MANIFEST_NAME,
                validate: validateAs(['input', 'important']),
            },
            {
                name: 'MANIFEST_SHORT_NAME',
                type: 'text',
                message: 'Enter the application short name:',
                initial: prev => params.MANIFEST_SHORT_NAME || prev,
                validate: validateAs(['input', 'important']),
            },
            {
                name: 'MANIFEST_DESCRIPTION',
                type: 'text',
                message: 'Enter the application description:',
                initial: params.MANIFEST_DESCRIPTION,
                validate: validateAs(['input', 'important']),
            },
            {
                name: 'MANIFEST_CATEGORIES',
                type: 'list',
                message: 'Specify applications categories (comma-separated):',
                initial: (params.MANIFEST_CATEGORIES || []).join(', '),
                validate: validateAs(['input']),
            },
            {
                name: 'MANIFEST_THEME_COLOR',
                type: 'text',
                message: 'Enter the application theme color:',
                initial: params.MANIFEST_THEME_COLOR,
                validate: validateAs(['input']),
            },
            {
                name: 'MANIFEST_BACKGROUND_COLOR',
                type: 'text',
                message: 'Enter the application background color:',
                initial: params.MANIFEST_BACKGROUND_COLOR,
                validate: validateAs(['input']),
            },
            {
                name: 'MANIFEST_ICONS',
                type: 'toggle',
                message: 'Add application icons?',
                active: 'YES',
                inactive: 'NO',
                initial: true,
                prompts: {
                    multiple: 'Add another icon?',
                    initial: params.MANIFEST_ICONS,
                    questions: [
                        {
                            name: 'src',
                            type: 'text',
                            message: 'Enter icon URL:',
                            validate: validateAs(['important']),
                        },
                        {
                            name: 'type',
                            type: 'text',
                            message: 'Enter icon MIME type:',
                            initial: prev => getMime(prev),
                            validate: validateAs(['important']),
                        },
                        {
                            name: 'sizes',
                            type: 'text',
                            message: 'Enter icon sizes:',
                            initial: (prev, answers) => getSize(answers.src),
                            validate: validateAs(['important']),
                        },
                    ],
                },
            },
            {
                name: 'MANIFEST_DISPLAY',
                type: 'select',
                message: 'Enter the application display mode:',
                choices: choices.display,
                initial: initialGetIndex(choices.display, params.MANIFEST_DISPLAY),
                validate: validateAs(['input']),
            },
            {
                name: 'MANIFEST_ORIENTATION',
                type: 'select',
                message: 'Enter the application orientation mode:',
                choices: choices.orientation,
                initial: initialGetIndex(choices.orientation, params.MANIFEST_ORIENTATION),
                validate: validateAs(['input']),
            },
            // ------------- advanced --------------
            {
                name: '__advanced',
                type: 'toggle',
                message: 'Show advanced options?',
                active: 'YES',
                inactive: 'NO',
                initial: params.__advanced,
            },
            // ------------- advanced --------------
            {
                name: 'MANIFEST_SCREENSHOTS',
                type: (prev, answers) => answers.__advanced ? 'toggle' : null,
                message: 'Add application screenshots?',
                active: 'YES',
                inactive: 'NO',
                initial: params.MANIFEST_SCREENSHOTS,
                prompts: {
                    multiple: 'Add another screenshot?',
                    initial: params.MANIFEST_SCREENSHOTS,
                    questions: [
                        {
                            name: 'src',
                            type: 'text',
                            message: 'Enter screenshot URL:',
                            validate: validateAs(['important']),
                        },
                        {
                            name: 'type',
                            type: 'text',
                            message: 'Enter screenshot MIME type:',
                            initial: prev => getMime(prev),
                            validate: validateAs(['important']),
                        },
                        {
                            name: 'sizes',
                            type: 'text',
                            message: 'Enter screenshot sizes:',
                            initial: (prev, answers) => getSize(answers.src),
                            validate: validateAs(['important']),
                        },
                    ],
                },
            },
            {
                name: 'MANIFEST_SHORTCUTS',
                type: (prev, answers) => answers.__advanced ? 'toggle' : null,
                message: 'Add application shortcuts?',
                active: 'YES',
                inactive: 'NO',
                initial: params.MANIFEST_SHORTCUTS,
                prompts: {
                    multiple: 'Add another shortcut?',
                    initial: params.MANIFEST_SHORTCUTS,
                    questions: [
                        {
                            name: 'name',
                            type: 'text',
                            message: 'Enter shortcut name:',
                            validate: validateAs(['important']),
                        },
                        {
                            name: 'short_name',
                            type: 'text',
                            message: 'Enter shortcut short name:',
                            validate: validateAs(['important']),
                        },
                        {
                            name: 'description',
                            type: 'text',
                            message: 'Enter shortcut description:',
                            validate: validateAs(['important']),
                        },
                        {
                            name: 'url',
                            type: 'text',
                            message: 'Enter shortcut URL:',
                            validate: validateAs(['important']),
                        },
                        {
                            name: 'icons',
                            type: 'toggle',
                            message: 'Add shortcut icons?',
                            active: 'YES',
                            inactive: 'NO',
                            prompts: {
                                multiple: 'Add another icon?',
                                questions: [
                                    {
                                        name: 'src',
                                        type: 'text',
                                        message: 'Enter icon URL:',
                                        validate: validateAs(['important']),
                                    },
                                    {
                                        name: 'type',
                                        type: 'text',
                                        message: 'Enter icon MIME type:',
                                        initial: prev => getMime(prev),
                                        validate: validateAs(['important']),
                                    },
                                    {
                                        name: 'sizes',
                                        type: 'text',
                                        message: 'Enter icon sizes:',
                                        initial: (prev, answers) => getSize(answers.src),
                                        validate: validateAs(['important']),
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
            {
                name: 'MANIFEST_SCOPE',
                type: (prev, answers) => answers.__advanced ? 'text' : null,
                message: 'Specify the manifest scope:',
                initial: params.MANIFEST_SCOPE,
                validate: validateAs(['input']),
            },
            {
                name: 'MANIFEST_START_URL',
                type: (prev, answers) => answers.__advanced ? 'text' : null,
                message: 'Specify the application start URL:',
                initial: params.MANIFEST_START_URL,
                validate: validateAs(['input']),
            },
            {
                name: 'MANIFEST_LANG',
                type: (prev, answers) => answers.__advanced ? 'text' : null,
                message: 'Specify the application language:',
                initial: params.MANIFEST_LANG,
                validate: validateAs(['input']),
            },
            {
                name: 'MANIFEST_DIR',
                type: (prev, answers) => answers.__advanced ? 'text' : null,
                message: 'Specify the application writing mode:',
                initial: params.MANIFEST_DIR,
                validate: validateAs(['input']),
            },
            {
                name: 'MANIFEST_RELATED_APPLICATIONS',
                type: (prev, answers) => answers.__advanced ? 'list' : null,
                message: 'Specify related applications (comma-separated):',
                initial: (params.MANIFEST_RELATED_APPLICATIONS || []).join(', '),
                validate: validateAs(['input']),
            },
            {
                name: 'MANIFEST_PREFER_RELATED_APPLICATIONS',
                type: (prev, answers) => answers.MANIFEST_RELATED_APPLICATIONS ? 'toggle' : null,
                message: 'Specify whether to "prefer" related applications:',
                active: 'YES',
                inactive: 'NO',
                initial: params.MANIFEST_PREFER_RELATED_APPLICATIONS,
                validate: validateAs(['confirm']),
            },

        ];

        console.log('');
        console.log(Chalk.whiteBright(`Enter parameters:`));
        _merge(params, await Promptx(questions));

    } else {

        console.log('');
        console.log(Chalk.whiteBright(`Creating a build with the following params:`));
        printArgs(params);

    }

    // ---------------------------

    if (!flags['CONFIG']) {
        DotJson.write(params, _paramsFile);
    }

    return params;
};
