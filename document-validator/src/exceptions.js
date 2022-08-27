// Copyright (c) 2022 - Byteplug Inc.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, July 2022

class ValidationError extends Error {
    constructor(path, message) {
        super(message)

        this.path = path
        this.message = message
    }
}

class ValidationWarning extends Error {
    constructor(path, message) {
        super(message)

        this.path = path
        this.message = message
    }
}

export { ValidationError, ValidationWarning }
