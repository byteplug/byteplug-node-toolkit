// Copyright (c) 2022-2023, Byteplug LLC.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, July 2022

import test from 'ava'
import { validateFormat, ValidationError } from '../src/index.js'

const VALID_NAMES = [
    "foobar",
    "FOOBAR",
    "123456",
    "foo-bar",
    "foo_bar"
]

const INVALID_NAMES = [
    "foo*bar",
    "foo&bar",
    "bar'foo",
    "foo)bar"

]

function boolValuePropertyTest(t, format, key, path) {
	validateFormat({ ...format, [key]: true })
	validateFormat({ ...format, [key]: false })

	var error = t.throws(() => {
		validateFormat({...format, [key]: 42})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a bool")

	var error = t.throws(() => {
		validateFormat({...format, [key]: "Hello world!"})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a bool")
}

function numberValuePropertyTest(t, format, key, path) {
	// To be written.
}

function stringValuePropertyTest(t, format, key, path) {
	validateFormat({ ...format, [key]: "Hello world!" })

	var error = t.throws(() => {
		validateFormat({...format, [key]: false})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a string")

	error = t.throws(() => {
		validateFormat({...format, [key]: true})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a string")

	error = t.throws(() => {
		validateFormat({...format, [key]: 42})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a string")
}

function namePropertyTest(t, format) {
	stringValuePropertyTest(t, format, "name", [])
}

function descriptionPropertyTest(t, format) {
	stringValuePropertyTest(t, format, "description", [])
}

function optionPropertyTest(t, format, path) {
	boolValuePropertyTest(t, format, "option", path)
}

function missingPropertyTest(t, format, property) {
	const error = t.throws(() => {
		validateFormat(format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, `'${property}' property is missing`)
}

function additionalPropertiesTest(t, format) {
	var errors = []
	validateFormat({ ...format, foo: 'bar', bar: 'foo' }, errors=errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, [])
	t.is(errors[1].message, "'bar' property is unexpected")
}

function lengthPropertyTest(t, format) {
	validateFormat({ ...format, length: 42 })

	validateFormat({ ...format, length: { minimum: 42 } })
	validateFormat({ ...format, length: { maximum: 42 } })
	validateFormat({ ...format, length: { minimum: 0, maximum: 42 } })

	var error = t.throws(() => {
		validateFormat({ ...format, length: -1 })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['length'])
	t.is(error.message, "must be greater or equal to zero")

	var warnings = []
	validateFormat({ ...format, length: 42.5 }, undefined, warnings)
	t.is(warnings.length, 1)
	t.deepEqual(warnings[0].path, ['length'])
	t.is(warnings[0].message, "should be an integer (got decimal)")

	var error = t.throws(() => {
		validateFormat({ ...format, length: { minimum: -1 }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['length', 'minimum'])
	t.is(error.message, "must be greater or equal to zero")

	var warnings = []
	validateFormat({ ...format, length: { minimum: 42.5 }}, undefined, warnings)
	t.is(warnings.length, 1)
	t.deepEqual(warnings[0].path, ['length', 'minimum'])
	t.is(warnings[0].message, "should be an integer (got decimal)")

	var error = t.throws(() => {
		validateFormat({ ...format, length: { maximum: -1 }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['length', 'maximum'])
	t.is(error.message, "must be greater or equal to zero")

	var warnings = []
	validateFormat({ ...format, length: { maximum: 42.5 }}, undefined, warnings)
	t.is(warnings.length, 1)
	t.deepEqual(warnings[0].path, ['length', 'maximum'])
	t.is(warnings[0].message, "should be an integer (got decimal)")

	for (const [minimum, maximum] of [[42, 0], [1, 0]]) {
		var error = t.throws(() => {
			validateFormat({ ...format, length: { minimum, maximum }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['length'])
		t.is(error.message, "minimum must be lower than maximum")
	}

	var error = t.throws(() => {
		validateFormat({ ...format, length: { foo: 'bar' }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['length'])
	t.is(error.message, "'foo' property is unexpected")
}

test('type-block', t => {
	// type blocks must be an object
	for (const format in [false, true, 42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateFormat(format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "value must be an object")
	}

	// 'type' property is missing
	missingPropertyTest(t, {}, 'type')

	// value of 'type' property is incorrect
	var error = t.throws(() => {
		validateFormat({ type: 'foo' })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value of 'type' is incorrect")
})

test('flag-type', t => {
	// test minimal format
	var format = { type: 'flag' }
	validateFormat(format)
	t.pass()

	//  test 'name' and 'description' properties
	namePropertyTest(t, format)
	descriptionPropertyTest(t, format)

	// test the 'option' property
	optionPropertyTest(t, format, [])

	// test additional properties
	additionalPropertiesTest(t, format)

	// test lazy validation
	var format = {
		type: 'flag' ,
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateFormat(format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['option'])
	t.is(errors[1].message, "value must be a bool")
})

test('number-type', t => {
	// test minimal format
	var format = { type: 'number' }
	validateFormat(format)

	// test 'name' and 'description' properties
	namePropertyTest(t, format)
	descriptionPropertyTest(t, format)

	// test 'decimal' property
	validateFormat({ ...format, decimal: false })
	validateFormat({ ...format, decimal: true })

	for (const invalidValue in [42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateFormat({ ...format, decimal: invalidValue })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['decimal'])
		t.is(error.message, "value must be a bool")
	}

	// test 'minimum' property
	validateFormat({ ...format, minimum: 42 })
	validateFormat({ ...format, minimum: { value: 42 }})
	validateFormat({ ...format, minimum: { exclusive: false, value: 42 }})
	validateFormat({ ...format, minimum: { exclusive: true, value: 42 }})

	for (const invalidValue of [false, true, "Hello world!"]) {
		var error = t.throws(() => {
			validateFormat({ ...format, minimum: invalidValue })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['minimum'])
		t.is(error.message, "value must be either a number or an object")
	}

	var error = t.throws(() => {
		validateFormat({ ...format, minimum: { exclusive: false}})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['minimum'])
	t.is(error.message, "'value' property is missing")

	for (const invalidValue of [42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateFormat({ ...format, minimum: { exclusive: invalidValue, value: 42 }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['minimum', 'exclusive'])
		t.is(error.message, "value must be a bool")
	}

	for (const invalidValue of [false, true, "Hello world!"]) {
		var error = t.throws(() => {
			validateFormat({ ...format, minimum: { exclusive: false, value: invalidValue }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['minimum', 'value'])
		t.is(error.message, "value must be a number")
	}

	var error = t.throws(() => {
		validateFormat({ ...format, minimum: { value: false, foo: 'bar' }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['minimum'])
	t.is(error.message, "'foo' property is unexpected")

	// test 'maximum' property
	validateFormat({ ...format, maximum: 42 })
	validateFormat({ ...format, maximum: { value: 42 }})
	validateFormat({ ...format, maximum: { exclusive: false, value: 42 }})
	validateFormat({ ...format, maximum: { exclusive: true, value: 42 }})

	for (const invalidValue of [false, true, "Hello world!"]) {
		var error = t.throws(() => {
			validateFormat({ ...format, maximum: invalidValue })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['maximum'])
		t.is(error.message, "value must be either a number or an object")
	}

	var error = t.throws(() => {
		validateFormat({ ...format, maximum: { exclusive: false}})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['maximum'])
	t.is(error.message, "'value' property is missing")

	for (const invalidValue of [42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateFormat({ ...format, maximum: { exclusive: invalidValue, value: 42 }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['maximum', 'exclusive'])
		t.is(error.message, "value must be a bool")
	}

	for (const invalidValue of [false, true, "Hello world!"]) {
		var error = t.throws(() => {
			validateFormat({ ...format, maximum: { exclusive: false, value: invalidValue }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['maximum', 'value'])
		t.is(error.message, "value must be a number")
	}

	var error = t.throws(() => {
		validateFormat({ ...format, maximum: { value: false, foo: 'bar' }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['maximum'])
	t.is(error.message, "'foo' property is unexpected")

	// test minimum must be lower than maximum
	for (const [minimum, maximum] of [[42, 0], [-9, -10], [1, -1]]) {
		var error = t.throws(() => {
			validateFormat({ ...format, minimum, maximum })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "minimum must be lower than maximum")
	}

	// test the 'option' property
	optionPropertyTest(t, format, [])

	// test additional properties
	additionalPropertiesTest(t, format)

	// test lazy validation
	var format = {
		type: 'number',
		decimal: 'foo',
		minimum: false,
		maximum: "Hello world!",
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateFormat(format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['decimal'])
	t.is(errors[1].message, "value must be a bool")
	t.deepEqual(errors[2].path, ['minimum'])
	t.is(errors[2].message, "value must be either a number or an object")
	t.deepEqual(errors[3].path, ['maximum'])
	t.is(errors[3].message, "value must be either a number or an object")
	t.deepEqual(errors[4].path, ['option'])
	t.is(errors[4].message, "value must be a bool")
})

test('string-type', t => {
	// test minimal format
	var format = { type: 'string' }
	validateFormat(format)

	// test 'name' and 'description' properties
	namePropertyTest(t, format)
	descriptionPropertyTest(t, format)

	// test the 'length' property
	lengthPropertyTest(t, format)

	// test the 'pattern' property
	validateFormat({ ...format, pattern: "^[a-z]+(-[a-z]+)*$"})
	stringValuePropertyTest(t, format, 'pattern', [])

	// test the 'option' property
	optionPropertyTest(t, format, [])

	// test additional properties
	additionalPropertiesTest(t, format)

	// test lazy validation
	var format = {
		type: 'string',
		length: false,
		pattern: 42,
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateFormat(format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['length'])
	t.is(errors[1].message, "value must be either a number or an object")
	t.deepEqual(errors[2].path, ['pattern'])
	t.is(errors[2].message, "value must be a string")
	t.deepEqual(errors[3].path, ['option'])
	t.is(errors[3].message, "value must be a bool")
})

test('array-type', t => {
	// test minimal format
	var format = {
		type: 'array',
		value: {
			type: 'string'
		}
	}

	missingPropertyTest(t, { type: 'array' }, 'value')

	validateFormat({ type: 'array', value: { type: 'flag' }})
	validateFormat({ type: 'array', value: { type: 'number' }})
	validateFormat(format)

	// test 'name' and 'description' properties
	namePropertyTest(t, format)
	descriptionPropertyTest(t, format)

	// test the 'value' property
	var error = t.throws(() => {
		validateFormat({ type: 'array', value: { type: 'foo' } })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['[]'])
	t.is(error.message, "value of 'type' is incorrect")

	// test the 'length' property
	lengthPropertyTest(t, format)

	// test the 'option' property
	optionPropertyTest(t, format, [])

	// test additional properties
	additionalPropertiesTest(t, format)

	// test nested arrays
	const nestedArrays = {
		type: 'array',
		value: {
			type: 'array',
			value: {
				type: 'array',
				value: { type: 'string' }
			}
		}
	}
	validateFormat(nestedArrays)

	// test lazy validation
	var format = {
		type: 'array',
        value: 42,
		length: false,
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateFormat(format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['[]'])
	t.is(errors[1].message, "value must be an object")
	t.deepEqual(errors[2].path, ['length'])
	t.is(errors[2].message, "value must be either a number or an object")
	t.deepEqual(errors[3].path, ['option'])
	t.is(errors[3].message, "value must be a bool")
})

test('object-type', t => {
	// test minimal format
	var format = {
		type: 'object',
		key: 'string',
		value: {
			type: 'string'
		}
	}
	validateFormat(format)

	missingPropertyTest(t, {type: 'object', value: { type: 'string'}}, 'key')
	missingPropertyTest(t, {type: 'object', key: 'string'}, 'value')

	// test 'name' and 'description' properties
	namePropertyTest(t, format)
	descriptionPropertyTest(t, format)

	// test the 'key' property
	for (const key of ['integer', 'string']) {
		validateFormat({ type: 'object', key: key, value: { type: 'string' } })
	}

	var error = t.throws(() => {
		validateFormat({ type: 'object', key: 'foo', value: { type: 'string' } })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value of 'key' must be either 'integer' or 'string'")

	// test the 'value' property
	var error = t.throws(() => {
		validateFormat({ type: 'object', value: { type: 'foo' } })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['{}'])
	t.is(error.message, "value of 'type' is incorrect")

	// test the 'length' property
	lengthPropertyTest(t, format)

	// test the 'option' property
	optionPropertyTest(t, format, [])

	// test additional properties
	additionalPropertiesTest(t, format)

	// test nested objects
	const nestedObjects = {
		type: 'object',
		key: 'integer',
		value: {
			type: 'object',
			key: 'string',
			value: {
				type: 'string'
			}
		}
	}
	validateFormat(nestedObjects)

	// test lazy validation
	var format = {
		type: 'object',
		key: 'foo',
        value: 42,
		length: false,
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateFormat(format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['{}'])
	t.is(errors[1].message, "value must be an object")
	t.deepEqual(errors[2].path, [])
	t.is(errors[2].message, "value of 'key' must be either 'integer' or 'string'")
	t.deepEqual(errors[3].path, ['length'])
	t.is(errors[3].message, "value must be either a number or an object")
	t.deepEqual(errors[4].path, ['option'])
	t.is(errors[4].message, "value must be a bool")
})

test('tuple-type', t => {
	// test minimal format
	var format = {
		type: 'tuple',
		items: [
			{ type: 'flag' },
			{ type: 'number' },
			{ type: 'string' }
		]
	}
	validateFormat(format)
	missingPropertyTest(t, { type: 'tuple'}, 'items')

	// test 'name' and 'description' properties
	namePropertyTest(t, format)
	descriptionPropertyTest(t, format)

	// test the 'items' property
	for (const value in [false, true, 42, 42.5, "Hello world!"]) {
		const error = t.throws(() => {
			validateFormat({ type: 'tuple', items: value })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['items'])
		t.is(error.message, "value must be an array")
	}

	var error = t.throws(() => {
		validateFormat({ type: 'tuple', items: [] })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['items'])
	t.is(error.message, "must contain at least one value")

	for (const value in [false, true, 42, 42.5, "Hello world!"]) {
		const error = t.throws(() => {
			validateFormat({ type: 'tuple', items: [value] })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['<0>'])
		t.is(error.message, "value must be an object")
	}

	error = t.throws(() => {
		validateFormat({ type: 'tuple', items: [{ type: 'foo' }] })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['<0>'])
	t.is(error.message, "value of 'type' is incorrect")

	// test the 'option' property
	optionPropertyTest(t, format, [])

	// test additional properties
	additionalPropertiesTest(t, format)

	// test nested tuples
	const nestedTuples = {
		type: 'tuple',
		items: [
			{
				type: 'tuple',
				items: [
					{
						type: 'tuple',
						items: [{ type: 'string' }]
					}
				]
			}
		]
	}
	validateFormat(nestedTuples)

	// test lazy validation
	var format = {
		type: 'tuple',
        items: [
			{ type: 'foo' },
			{ type: 'bar' },
			{ type: 'quz' }
		],
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateFormat(format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['<0>'])
	t.is(errors[1].message, "value of 'type' is incorrect")
	t.deepEqual(errors[2].path, ['<1>'])
	t.is(errors[2].message, "value of 'type' is incorrect")
	t.deepEqual(errors[3].path, ['<2>'])
	t.is(errors[3].message, "value of 'type' is incorrect")
	t.deepEqual(errors[4].path, ['option'])
	t.is(errors[4].message, "value must be a bool")
})

test('map-type', t => {
	// test minimal format
	var format = {
		type: 'map',
		fields: {
			foo: { type: 'flag' },
			bar: { type: 'number' },
			quz: { type: 'string' }
		}
	}
	validateFormat(format)
	missingPropertyTest(t, { type: 'map'}, 'fields')

	// test 'name' and 'description' properties
	namePropertyTest(t, format)
	descriptionPropertyTest(t, format)

	// test the 'fields' property
	for (const value in [false, true, 42, 42.5, "Hello world!"]) {
		const error = t.throws(() => {
			validateFormat({ type: 'map', fields: value })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['fields'])
		t.is(error.message, "value must be an object")
	}

	var error = t.throws(() => {
		validateFormat({ type: 'map', fields: {} })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['fields'])
	t.is(error.message, "must contain at least one field")

	for (const name of VALID_NAMES) {
		const format = {
			type: 'map',
			fields: {
				[name]: {
					type: 'flag'
				}
			}
		}
		validateFormat(format)
	}

	for (const name of INVALID_NAMES) {
		const format = {
			type: 'map',
			fields: {
				[name]: {
					type: 'flag'
				}
			}
		}

		const error = t.throws(() => {
			validateFormat(format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['fields'])
		t.is(error.message, `'${name}' is an incorrect key name`)
	}

	for (const value in [false, true, 42, 42.5, "Hello world!"]) {
		const error = t.throws(() => {
			validateFormat({ type: 'map', fields: { foo: value } })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['$foo'])
		t.is(error.message, "value must be an object")
	}

	error = t.throws(() => {
		validateFormat({ type: 'map', fields: { foo: { type: 'bar' } }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['$foo'])
	t.is(error.message, "value of 'type' is incorrect")

	// test the 'option' property
	optionPropertyTest(t, format, [])

	// test additional properties
	additionalPropertiesTest(t, format)

	// test  nested maps
	const nestedMaps = {
		type: 'map',
		fields: {
			foo: {
				type: 'map',
				fields: {
					bar: {
						type: 'map',
						fields: {
							quz: { type: 'string' }
						}
					}
				}
			}
		}
	}
	validateFormat(nestedMaps)

	// test lazy validation
	var format = {
		type: 'map',
        fields: {
			'@foo': { type: 'flag' },
			bar: { type: 'foo' }
		},
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateFormat(format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['fields'])
	t.is(errors[1].message, "'@foo' is an incorrect key name")
	t.deepEqual(errors[2].path, ['$bar'])
	t.is(errors[2].message, "value of 'type' is incorrect")
	t.deepEqual(errors[3].path, ['option'])
	t.is(errors[3].message, "value must be a bool")
})

test('enum-type', t => {
	// test minimal format
	var format = {
		type: 'enum',
		values: ['foo', 'bar', 'quz']
	}
	validateFormat(format)

	var error = t.throws(() => {
		validateFormat({type: 'enum'})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "'values' property is missing")

	// test the 'values' property
	for (const value in [true, false, 42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateFormat({type: 'enum', values: value})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['values'])
		t.is(error.message, "value must be an array")
	}

	var error = t.throws(() => {
		validateFormat({type: 'enum', values: []})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['values'])
	t.is(error.message, "must contain at least one value")

	var error = t.throws(() => {
		validateFormat({type: 'enum', values: ['@foo', 'bar', 'quz']})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['values'])
	t.is(error.message, "'@foo' is an incorrect value")

	var error = t.throws(() => {
		validateFormat({type: 'enum', values: ['foo', 'bar', 'quz', 'foo']})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['values'])
	t.is(error.message, "'foo' value is duplicated")

	// test the 'option' property
	optionPropertyTest(t, format, [])

	// test additional properties
	additionalPropertiesTest(t, format)

	// test 'name' and 'description' properties
	namePropertyTest(t, format)
	descriptionPropertyTest(t, format)

	// test lazy validation
	var format = {
		type: 'enum',
        values: ['@foo', 'bar', 'quz', 'bar'],
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateFormat(format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['values'])
	t.is(errors[1].message, "'@foo' is an incorrect value")
	t.deepEqual(errors[2].path, ['values'])
	t.is(errors[2].message, "'bar' value is duplicated")
	t.deepEqual(errors[3].path, ['option'])
	t.is(errors[3].message, "value must be a bool")
})

