// Copyright (c) 2022-2023, Byteplug LLC.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, August 2022

import { ValidationError } from './exceptions.js'

function readMinimumValue(format) {
    if (format.minimum !== undefined) {
        if (typeof format.minimum === 'number') {
            return {
                exclusive: false,
                value: format.minimum
            }
        }
        else {
            return {
                exclusive: format.minimum.exclusive || false,
                value: format.minimum.value
            }
        }
    }
}

function readMaximumValue(format) {
    if (format.maximum !== undefined) {
        if (typeof format.maximum === 'number') {
            return {
                exclusive: false,
                value: format.maximum
            }
        }
        else {
            return {
                exclusive: format.maximum.exclusive || false,
                value: format.maximum.value
            }
        }
    }
}

function checkLength(value, length, path, errors, warnings) {
    if (typeof length === 'number') {
        length = Number.parseInt(length)

        if (value != length) {
            const error = new ValidationError(path, `length must be equal to ${length}`)
            errors.push(error)
            return
        }
    }
    else {
        if (length.minimum !== undefined) {
            length.minimum = Number.parseInt(length.minimum)

            if (!(value >= length.minimum)) {
                const error = new ValidationError(path, `length must be equal or greater than ${length.minimum}`)
                errors.push(error)
                return
            }
        }

        if (length.maximum !== undefined) {
            length.maximum = Number.parseInt(length.maximum)

            if (!(value <= length.maximum)) {
                const error = new ValidationError(path, `length must be equal or lower than ${length.maximum}`)
                errors.push(error)
                return
            }
        }
    }
}

export { readMinimumValue, readMaximumValue, checkLength }
