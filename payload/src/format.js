// Copyright (c) 2022-2023, Byteplug LLC.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, July 2022

import { ValidationError, ValidationWarning } from "./exceptions.js"
import assert from "./assert.js"

function validateMinimumOrMaximumProperty(name, path, block, errors) {

    if (typeof block === 'number') {
        return {
            exclusive: false,
            value: block
        }
    }
    else if (typeof block === 'object') {
        const extraProperties = Object.keys(block).filter(property => {
            return !['exclusive', 'value'].includes(property)
        })

        if (extraProperties.length > 0) {
            for (const property of extraProperties) {
                const error = new ValidationError(path.concat(name), `'${property}' property is unexpected`)
                errors.push(error)
            }
            return
        }

        var exclusive = false
        if (block.exclusive !== undefined) {
            if (typeof block.exclusive !== 'boolean') {
                const error = new ValidationError(path.concat([name, 'exclusive']), "value must be a bool")
                errors.push(error)
            }
            else {
                exclusive = true
            }
        }

        if (block.value === undefined) {
            const error = new ValidationError(path.concat(name), "'value' property is missing")
            errors.push(error)
            return
        }

        if (typeof block.value !== 'number') {
            const error = new ValidationError(path.concat([name, 'value']), "value must be a number")
            errors.push(error)
            return
        }

        return {
            exclusive: exclusive,
            value: block.value
        }
    }
    else {
        const error = new ValidationError(path.concat(name), "value must be either a number or an object")
        errors.push(error)
    }
}

function validateLengthProperty(path, value, errors, warnings) {

    path = path.concat('length')

    if (typeof value === 'number') {
        if (!Number.isInteger(value)) {
            const warning = new ValidationWarning(path, "should be an integer (got decimal)")
            warnings.push(warning)
        }

        if (value < 0) {
            const error = new ValidationError(path, "must be greater or equal to zero")
            errors.push(error)
        }
    }
    else if (typeof value === 'object') {
        const extraProperties = Object.keys(value).filter(property => {
            return !['minimum', 'maximum'].includes(property)
        })

        if (extraProperties.length > 0) {
            for (const property of extraProperties) {
                const error = new ValidationError(path, `'${property}' property is unexpected`)
                errors.push(error)
            }

            return
        }

        if (value.minimum !== undefined) {
            if (typeof value.minimum !== 'number') {
                const error = new ValidationError(path.concat('minimum'), "value must be a number")
                errors.push(error)
            }

            if (!Number.isInteger(value.minimum)) {
                const warning = new ValidationWarning(path.concat('minimum'), "should be an integer (got decimal)")
                warnings.push(warning)
            }

            if (value.minimum < 0) {
                const error = new ValidationError(path.concat('minimum'), "must be greater or equal to zero")
                errors.push(error)
            }
        }

        if (value.maximum !== undefined) {
            if (typeof value.maximum !== 'number') {
                const error = new ValidationError(path.concat('maximum'), "value must be a number")
                errors.push(error)
            }

            if (!Number.isInteger(value.maximum)) {
                const warning = new ValidationWarning(path.concat('maximum'), "should be an integer (got decimal)")
                warnings.push(warning)
            }

            if (value.maximum < 0) {
                const error = new ValidationError(path.concat('maximum'), "must be greater or equal to zero")
                errors.push(error)
            }
        }

        if (value.minimum !== undefined && value.maximum !== undefined) {
            if (value.minimum > value.maximum) {
                const error = new ValidationError(path, "minimum must be lower than maximum")
                errors.push(error)
            }
        }
    }
    else {
        const error = new ValidationError(path, "value must be either a number or an object")
        errors.push(error)
    }
}

function validateFlagBlock(path, block, errors, warnings) {
    // Nothing to do.
}

function validateNumberBlock(path, block, errors, warnings) {
    if (block.decimal !== undefined && typeof block.decimal !== 'boolean') {
        const error = new ValidationError(path.concat('decimal'), "value must be a bool")
        errors.push(error)
    }

    var minimum, maximum

    if (block.minimum !== undefined) {
        minimum = validateMinimumOrMaximumProperty('minimum', path, block.minimum, errors)
    }

    if (block.maximum !== undefined) {
        maximum = validateMinimumOrMaximumProperty('maximum', path, block.maximum, errors)
    }

    if (minimum !== undefined && maximum !== undefined) {
        if (maximum.value < minimum.value) {
            const error = new ValidationError(path, "minimum must be lower than maximum")
            errors.push(error)
        }
    }
}

function validateStringBlock(path, block, errors, warnings) {
    if (block.length !== undefined)
        validateLengthProperty(path, block.length, errors, warnings)

    // TODO; Check validity of the regex.
    if (block.pattern !== undefined && typeof block.pattern !== 'string') {
        const error = new ValidationError(path.concat('pattern'), "value must be a string")
        errors.push(error)
    }
}

function validateArrayBlock(path, block, errors, warnings) {
    if (block.value === undefined) {
        const error = new ValidationError(path, "'value' property is missing")
        errors.push(error)
        return
    }

    validateBlock(path.concat('[]'), block.value, errors, warnings)

    if (block.length !== undefined)
        validateLengthProperty(path, block.length, errors, warnings)
}

function validateObjectBlock(path, block, errors, warnings) {
    if (block.value !== undefined) {
        validateBlock(path.concat('{}'), block.value, errors, warnings)
    }
    else {
        const error = new ValidationError(path, "'value' property is missing")
        errors.push(error)
    }

    if (block.key !== undefined) {
        if (!['string', 'integer'].includes(block.key)) {
            const error = new ValidationError(path, "value of 'key' must be either 'integer' or 'string'")
            errors.push(error)
        }
    }
    else {
        const error = new ValidationError(path, "'key' property is missing")
        errors.push(error)
    }

    if (block.length !== undefined)
        validateLengthProperty(path, block.length, errors, warnings)
}

function validateTupleBlock(path, block, errors, warnings) {
    if (block.items === undefined) {
        const error = new ValidationError(path, "'items' property is missing")
        errors.push(error)
        return
    }

    if (block.items.constructor !== Array) {
        const error = new ValidationError(path.concat('items'), "value must be an array")
        errors.push(error)
        return
    }

    if (block.items.length == 0) {
        const error = new ValidationError(path.concat('items'), "must contain at least one value")
        errors.push(error)
        return
    }

    block.items.forEach((value, index) => {
        validateBlock(path.concat(`<${index}>`), value, errors, warnings)
    })
}

function validateMapBlock(path, block, errors, warnings) {
    if (block.fields === undefined) {
        const error = new ValidationError(path, "'fields' property is missing")
        errors.push(error)
        return
    }

    if (typeof block.fields !== 'object') {
        const error = new ValidationError(path.concat('fields'), "value must be an object")
        errors.push(error)
        return
    }

    if (Object.keys(block.fields).length == 0) {
        const error = new ValidationError(path.concat('fields'), "must contain at least one field")
        errors.push(error)
        return
    }

    for (const [key, value] of Object.entries(block.fields)) {
        if (!/^[a-zA-Z0-9\-\_]+$/.test(key)) {
            const error = new ValidationError(path.concat('fields'), `'${key}' is an incorrect key name`)
            errors.push(error)
            continue
        }

        validateBlock(path.concat(`$${key}`), value, errors, warnings)
    }
}

function validateEnumBlock(path, block, errors, warnings) {
    if (block.values === undefined) {
        const error = new ValidationError(path, "'values' property is missing")
        errors.push(error)
        return
    }

    if (block.values.constructor !== Array) {
        const error = new ValidationError(path.concat('values'), "value must be an array")
        errors.push(error)
        return
    }

    if (block.values.length == 0) {
        const error = new ValidationError(path.concat('values'), "must contain at least one value")
        errors.push(error)
        return
    }

    var processedValues = []
    block.values.forEach(value => {
        if (!/^[a-zA-Z0-9\-\_]+$/.test(value)) {
            const error = new ValidationError(path.concat('values'), `'${value}' is an incorrect value`)
            errors.push(error)
            return
        }

        if (processedValues.includes(value)) {
            const error = new ValidationError(path.concat('values'), `'${value}' value is duplicated`)
            errors.push(error)
            return
        }
        else {
            processedValues.push(value)
        }
    })
}

const validators = {
    flag: {
        function: validateFlagBlock,
        properties: []
    },
    number: {
        function: validateNumberBlock,
        properties: ['decimal', 'minimum', 'maximum']
    },
    string: {
        function: validateStringBlock,
        properties: ['length', 'pattern']
    },
    array: {
        function: validateArrayBlock,
        properties: ['value', 'length']
    },
    object: {
        function: validateObjectBlock,
        properties: ['key', 'value', 'length']
    },
    tuple: {
        function: validateTupleBlock,
        properties: ['items']
    },
    map: {
        function: validateMapBlock,
        properties: ['fields']
    },
    enum: {
        function: validateEnumBlock,
        properties: ['values']
    }
}

function validateBlock(path, block, errors, warnings) {
    if (typeof block !== 'object') {
        const error = new ValidationError(path, "value must be an object")
        errors.push(error)
        return
    }

    if (block.type === undefined) {
        const error = new ValidationError(path, "'type' property is missing")
        errors.push(error)
        return
    }

    if (!Object.keys(validators).includes(block.type)) {
        var error = new ValidationError(path, "value of 'type' is incorrect")
        errors.push(error)
        return
    }

    const commonProperties = ['name', 'description', 'type', 'option']
    var extraProperties = Object.keys(block).filter(property => {
        return !(validators[block.type].properties.includes(property) || commonProperties.includes(property))
    })

    extraProperties.forEach(property => {
        const error = new ValidationError(path, `'${property}' property is unexpected`)
        errors.push(error)
    })

    validators[block.type].function(path, block, errors, warnings)

    if (block.name !== undefined && typeof block.name !== 'string') {
        const error = new ValidationError(path.concat('name'), "value must be a string")
        errors.push(error)
    }

    if (block.description !== undefined && typeof block.description !== 'string') {
        const error = new ValidationError(path.concat('description'), "value must be a string")
        errors.push(error)
    }

    if (block.option !== undefined && typeof block.option !== 'boolean') {
        const error = new ValidationError(path.concat('option'), "value must be a bool")
        errors.push(error)
    }
}

/*
- format  must be in the object form, use a yaml lib to read the raw string

*/

/**
 * To be written.
 *
 * @memberof Payload
 * @param {object} format - To be written.
 * @param {array} errors - To be written.
 * @param {array} warnings - To be written.
 */
function validateFormat(format, errors, warnings) {
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

    validateBlock([], format, errors, warnings)

    // If we're not lazy-validating the format, we raise the first error that
    // occurred, if any.
    if (!lazyValidation && errors.length > 0) {
        throw errors[0]
    }
}

export default validateFormat
