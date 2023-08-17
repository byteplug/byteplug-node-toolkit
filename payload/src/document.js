// Copyright (c) 2022-2023, Byteplug LLC.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, August 2022

import { ValidationError } from "./exceptions.js"
import { readMinimumValue, readMaximumValue, checkLength } from "./utility.js"
import assert from "./assert.js"

function processFlagNode(path, node, format, errors, warnings) {
    if (typeof node !== 'boolean') {
        const error = new ValidationError(path, "was expecting a JSON boolean")
        errors.push(error)
        return
    }

    return node
}

function processNumberNode(path, node, format, errors, warnings) {
    var decimal = format.decimal
    if (decimal === undefined) {
        decimal = true
    }

    var minimum = readMinimumValue(format)
    var maximum = readMaximumValue(format)

    if (typeof node !== 'number') {
        const error = new ValidationError(path, "was expecting a JSON number")
        errors.push(error)
        return
    }

    if (decimal == false && !Number.isInteger(node)) {
        const error = new ValidationError(path, "was expecting non-decimal number")
        errors.push(error)
        return
    }

    var nodeErrors = []

    if (minimum !== undefined) {
        if (minimum.exclusive) {
            if (!(node > minimum.value)) {
                const error = new ValidationError(path, `value must be strictly greater than ${minimum.value}`)
                nodeErrors.push(error)
            }
        }
        else {
            if (!(node >= minimum.value)) {
                const error = new ValidationError(path, `value must be equal or greater than ${minimum.value}`)
                nodeErrors.push(error)
            }
        }
    }

    if (maximum !== undefined) {
        if (maximum.exclusive) {
            if (!(node < maximum.value)) {
                const error = new ValidationError(path, `value must be strictly lower than ${maximum.value}`)
                nodeErrors.push(error)
            }
        }
        else {
            if (!(node <= maximum.value)) {
                const error = new ValidationError(path, `value must be equal or lower than ${maximum.value}`)
                nodeErrors.push(error)
            }
        }
    }

    if (nodeErrors.length > 0) {
        errors.push(...nodeErrors)
        return
    }

    return node
}

function processStringNode(path, node, format, errors, warnings) {
    if (typeof node !== 'string') {
        const error = new ValidationError(path, "was expecting a JSON string")
        errors.push(error)
        return
    }

    var nodeErrors = []

    if (format.length !== undefined) {
        checkLength(node.length, format.length, path, errors, warnings)
    }

    if (format.pattern !== undefined) {
        if (!new RegExp(format.pattern).test(node)) {
            const error = new ValidationError(path, "value did not match the pattern")
            errors.push(error)
        }
    }

    if (nodeErrors.length > 0) {
        errors.push(...nodeErrors)
        return
    }

    return node
}

function processArrayNode(path, node, format, errors, warnings) {
    if (node.constructor !== Array) {
        const error = new ValidationError(path, "was expecting a JSON array")
        errors.push(error)
        return
    }

    if (format.length !== undefined) {
        checkLength(node.length, format.length, path, errors, warnings)
    }

    var adjustedNode = []
    node.forEach((item, index) => {
        var adjustedItem = adjustNode(path.concat(`[${index}]`), item, format.value, errors, warnings)
        adjustedNode.push(adjustedItem)
    })

    return adjustedNode
}

function processObjectNode(path, node, format, errors, warnings) {
    if (node.constructor === Array || typeof node !== 'object') {
        const error = new ValidationError(path, "was expecting a JSON object")
        errors.push(error)
        return
    }

    if (format.length !== undefined) {
        checkLength(Object.keys(node).length, format.length, path, errors, warnings)
    }

    var adjustedNode = {}
    Object.keys(node).forEach((itemKey, index) => {
        var nodeKey

        if (format.key === 'integer') {
            nodeKey = Number.parseFloat(itemKey)
            // TODO; check for NaN, parseInt() is very tolerant; find a more restrictive sol ?
            if (nodeKey === undefined || nodeKey === NaN || !Number.isInteger(nodeKey)) {
                const error = new ValidationError(path, `key at index ${index} is invalid; expected it to be an integer`)
                errors.push(error)
                return
            }
        }
        else if (format.key === 'string') {
            if (!/^[a-zA-Z0-9\-\_]+$/.test(itemKey)) {
                const error = new ValidationError(path, `key at index ${index} is invalid; expected to match the pattern`)
                errors.push(error)
                return
            }

            nodeKey = itemKey
        }

        var adjustedValue = adjustNode(path.concat(`{${itemKey}}`), node[itemKey], format.value, errors, warnings)
        adjustedNode[nodeKey] = adjustedValue
    })

    return adjustedNode
}

function processTupleNode(path, node, format, errors, warnings) {
    if (node.constructor !== Array) {
        const error = new ValidationError(path, "was expecting a JSON array")
        errors.push(error)
        return
    }

    if (node.length != format.items.length) {
        const error = new ValidationError(path, `length of the array must be ${format.items.length}`)
        errors.push(error)
        return
    }

    var adjustedNode = []
    node.forEach((item, index) => {
        var adjustedItem = adjustNode(path.concat(`<${index}>`), item, format.items[index], errors, warnings)
        adjustedNode.push(adjustedItem)
    })

    return adjustedNode
}

function processMapNode(path, node, format, errors, warnings) {
    if (node.constructor === Array || typeof node !== 'object') {
        const error = new ValidationError(path, "was expecting a JSON object")
        errors.push(error)
        return
    }

    var nodeErrors = []

    var adjustedNode = {}
    for (const [key, value] of Object.entries(node)) {
        if (key in format.fields) {
            adjustedNode[key] = adjustNode(path.concat(`$${key}`), value, format.fields[key], errors, warnings)
        }
        else {
            const error = new ValidationError(path, `'${key}' field was unexpected`)
            errors.push(error)
        }
    }

    const missingKeys = Object.keys(format.fields).filter(key => {
        return !(key in adjustedNode)
    })

    missingKeys.forEach(key => {
        if (format.fields[key].option === undefined || format.fields[key].option == false) {
            const error = new ValidationError(path, `'${key}' field was missing`)
            errors.push(error)
        }
        else {
            // We insert a 'null' value when the key is missing and the item is
            // optional.
            adjustedNode[key] = null
        }
    })

    if (nodeErrors.length > 0) {
        errors.push(...nodeErrors)
        return
    }

    return adjustedNode
}

function processEnumNode(path, node, format, errors, warnings) {
    if (typeof node !== 'string') {
        const error = new ValidationError(path, "was expecting a JSON string")
        errors.push(error)
        return
    }

    if (!format.values.includes(node)) {
        const error = new ValidationError(path, "enum value is invalid")
        errors.push(error)
        return
    }

    return node
}

const processors = {
    flag   : processFlagNode,
    number : processNumberNode,
    string : processStringNode,
    array  : processArrayNode,
    object : processObjectNode,
    tuple  : processTupleNode,
    map    : processMapNode,
    enum   : processEnumNode,
}

function adjustNode(path, node, format, errors, warnings) {
    // We accept a null value is the type is marked as optional.
    var optional = false
    if (format.option !== undefined)
        optional = format.option

    if (optional && node === null)
        return null

    return processors[format.type](path, node, format, errors, warnings)
}

/**
 * To be written.
 *
 * @memberof Document
 * @param {object} document - To be written.
 * @param {object} format - To be written.
 * @param {array} errors - To be written.
 * @param {array} warnings - To be written.
 * @returns {object} - To be written.
 */
function documentToObject(document, format, errors, warnings) {
    // If errors and warnings parameters are set, they must be empty array.
    assert(
        errors === undefined || (errors.constructor === Array && errors.length == 0),
        "if the errors parameter is set, it must be an empty array"
    )
    assert(
        warnings === undefined || (warnings.constructor === Array && warnings.length == 0),
        "if the warnings parameter is set, it must be an empty array"
    )

    // We detect if users want lazy validation when they pass an empty array as
    // the errors parameters.
    var lazyValidation = false
    if (errors === undefined) {
        errors = []
    }
    else {
        lazyValidation = true
    }

    if (warnings === undefined) {
        warnings = []
    }

    const object = JSON.parse(document)
    const adjustedObject = adjustNode([], object, format, errors, warnings)

    // If we're not lazy-validating, we raise the first error that occurred, if
    // any.
    if (!lazyValidation && errors.length > 0) {
        throw errors[0]
    }

    return adjustedObject
}

export default documentToObject
