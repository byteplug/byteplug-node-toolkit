// Copyright (c) 2022 - Byteplug Inc.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, July 2022

/** The @byteplug/document namespace.
 *
 * @namespace Document
 * @version 0.0.1
 * @author Jonathan De Wachter
 * @copyright 2022
 */

import validateSpecs from "./specs.js"
import documentToObject from "./document.js"
import objectToDocument from "./object.js"
import { ValidationError, ValidationWarning } from "./exceptions.js"

export {
    validateSpecs,
    documentToObject,
    objectToDocument,
    ValidationError,
    ValidationWarning
}
