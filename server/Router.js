
/**
 * @imports
 */
import fs from 'fs';
import Url from 'url';
import path from 'path';
import _isString from '@web-native-js/commons/js/isString.js';

export default class Router {

    /**
     * Instantiates a new Router.
     * 
     * @param object            params
     * 
     * @return void
     */
    constructor(params) {
        this.params = params;
    }

    /**
     * Performs dynamic routing.
     * 
     * @param object            request
     * 
     * @return object
     */
    async route(request) {
        var params = this.params;
        var localFetch = this.fetch.bind(this);
        // ----------------
        // ROUTER
        // ----------------
        var pathSplit = request.url.pathname.split('/').filter(a => a);
        const next = async function(index, recieved) {
            var routeHandlerFile;
            if (index === 0) {
                routeHandlerFile = 'index.js';
            } else if (pathSplit[index - 1]) {
                var routeSlice = pathSplit.slice(0, index).join('/');
                routeHandlerFile = path.join(routeSlice, './index.js');
            }
            if (routeHandlerFile && fs.existsSync(routeHandlerFile = path.join(params.appDir, routeHandlerFile))) {
                // -------------
                // Dynamic response
                // -------------
                var pathHandler = await import('file:///' + routeHandlerFile + '?_r=' + Date.now());
                var _next = (...args) => next(index + 1, ...args);
                _next.path = pathSplit.slice(index).join('/');
                return await pathHandler.default(request, recieved, _next/*next*/);
            }
            if (arguments.length === 1) {
                // -------------
                // Local file
                // -------------
                return await localFetch(request.url.href, request);
            }
            // -------------
            // Recieved response or undefined
            // -------------
            return recieved;
        };
        return next(0);
    }

    /**
     * Performs dynamic routing.
     * 
     * @param object filename
     * @param object options
     * 
     * @return Promise
     */
    async fetch(filename, options) {
        var _filename = path.join(this.params.publicDir, '.', filename);
        var autoIndex;
        if (fs.existsSync(_filename)) {
            // based on the URL path, extract the file extention. e.g. .js, .doc, ...
            var ext = path.parse(filename).ext;
            // read file from file system
            return new Promise((resolve, reject) => {
                // if is a directory search for index file matching the extention
                if (!ext && filename.lastIndexOf('.') < filename.lastIndexOf('/')) {
                    ext = '.html';
                    _filename += '/index' + ext;
                    autoIndex = 'index.html';
                    if (!fs.existsSync(_filename)) {
                        resolve();
                        return;
                    }
                }
                fs.readFile(_filename, function(err, data){
                    if (err) {
                        // To be thrown by caller
                        reject({
                            errorCode: 500,
                            error: 'Error reading static file: ' + filename + '.',
                        });
                    } else {
                        // if the file is found, set Content-type and send data
                        resolve(new StaticResponse(data, mimeTypes[ext] || 'text/plain', autoIndex));
                    }
                });
            });
        }
    }
};

// maps file extention to MIME typere
const mimeTypes = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
};

export { mimeTypes };

// Static response
export class StaticResponse {
    // construct
    constructor(content, contentType, autoIndex) {
        this.content = content;
        this.contentType = contentType;
        this.autoIndex = autoIndex;
        this.static = true;
    }
};