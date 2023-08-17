// Copyright (c) 2022-2023, Byteplug LLC.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, July 2022

import test from 'ava'
import { validateSpecs, ValidationError } from '../src/index.js'

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

function boolValuePropertyTest(t, specs, key, path) {
	validateSpecs({ ...specs, [key]: true })
	validateSpecs({ ...specs, [key]: false })

	var error = t.throws(() => {
		validateSpecs({...specs, [key]: 42})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a bool")

	var error = t.throws(() => {
		validateSpecs({...specs, [key]: "Hello world!"})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a bool")
}

function numberValuePropertyTest(t, specs, key, path) {
	// To be written.
}

function stringValuePropertyTest(t, specs, key, path) {
	validateSpecs({ ...specs, [key]: "Hello world!" })

	var error = t.throws(() => {
		validateSpecs({...specs, [key]: false})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a string")

	error = t.throws(() => {
		validateSpecs({...specs, [key]: true})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a string")

	error = t.throws(() => {
		validateSpecs({...specs, [key]: 42})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, path.concat(key))
	t.is(error.message, "value must be a string")
}

function namePropertyTest(t, specs) {
	stringValuePropertyTest(t, specs, "name", [])
}

function descriptionPropertyTest(t, specs) {
	stringValuePropertyTest(t, specs, "description", [])
}

function optionPropertyTest(t, specs, path) {
	boolValuePropertyTest(t, specs, "option", path)
}

function missingPropertyTest(t, specs, property) {
	const error = t.throws(() => {
		validateSpecs(specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, `'${property}' property is missing`)
}

function additionalPropertiesTest(t, specs) {
	var errors = []
	validateSpecs({ ...specs, foo: 'bar', bar: 'foo' }, errors=errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, [])
	t.is(errors[1].message, "'bar' property is unexpected")
}

function lengthPropertyTest(t, specs) {
	validateSpecs({ ...specs, length: 42 })

	validateSpecs({ ...specs, length: { minimum: 42 } })
	validateSpecs({ ...specs, length: { maximum: 42 } })
	validateSpecs({ ...specs, length: { minimum: 0, maximum: 42 } })

	var error = t.throws(() => {
		validateSpecs({ ...specs, length: -1 })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['length'])
	t.is(error.message, "must be greater or equal to zero")

	var warnings = []
	validateSpecs({ ...specs, length: 42.5 }, undefined, warnings)
	t.is(warnings.length, 1)
	t.deepEqual(warnings[0].path, ['length'])
	t.is(warnings[0].message, "should be an integer (got decimal)")

	var error = t.throws(() => {
		validateSpecs({ ...specs, length: { minimum: -1 }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['length', 'minimum'])
	t.is(error.message, "must be greater or equal to zero")

	var warnings = []
	validateSpecs({ ...specs, length: { minimum: 42.5 }}, undefined, warnings)
	t.is(warnings.length, 1)
	t.deepEqual(warnings[0].path, ['length', 'minimum'])
	t.is(warnings[0].message, "should be an integer (got decimal)")

	var error = t.throws(() => {
		validateSpecs({ ...specs, length: { maximum: -1 }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['length', 'maximum'])
	t.is(error.message, "must be greater or equal to zero")

	var warnings = []
	validateSpecs({ ...specs, length: { maximum: 42.5 }}, undefined, warnings)
	t.is(warnings.length, 1)
	t.deepEqual(warnings[0].path, ['length', 'maximum'])
	t.is(warnings[0].message, "should be an integer (got decimal)")

	for (const [minimum, maximum] of [[42, 0], [1, 0]]) {
		var error = t.throws(() => {
			validateSpecs({ ...specs, length: { minimum, maximum }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['length'])
		t.is(error.message, "minimum must be lower than maximum")
	}

	var error = t.throws(() => {
		validateSpecs({ ...specs, length: { foo: 'bar' }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['length'])
	t.is(error.message, "'foo' property is unexpected")
}

test('type-block', t => {
	// type blocks must be an object
	for (const specs in [false, true, 42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateSpecs(specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "value must be an object")
	}

	// 'type' property is missing
	missingPropertyTest(t, {}, 'type')

	// value of 'type' property is incorrect
	var error = t.throws(() => {
		validateSpecs({ type: 'foo' })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value of 'type' is incorrect")
})

test('flag-type', t => {
	// test minimal specs
	var specs = { type: 'flag' }
	validateSpecs(specs)
	t.pass()

	//  test 'name' and 'description' properties
	namePropertyTest(t, specs)
	descriptionPropertyTest(t, specs)

	// test the 'option' property
	optionPropertyTest(t, specs, [])

	// test additional properties
	additionalPropertiesTest(t, specs)

	// test lazy validation
	var specs = {
		type: 'flag' ,
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateSpecs(specs, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['option'])
	t.is(errors[1].message, "value must be a bool")
})

test('number-type', t => {
	// test minimal specs
	var specs = { type: 'number' }
	validateSpecs(specs)

	// test 'name' and 'description' properties
	namePropertyTest(t, specs)
	descriptionPropertyTest(t, specs)

	// test 'decimal' property
	validateSpecs({ ...specs, decimal: false })
	validateSpecs({ ...specs, decimal: true })

	for (const invalidValue in [42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateSpecs({ ...specs, decimal: invalidValue })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['decimal'])
		t.is(error.message, "value must be a bool")
	}

	// test 'minimum' property
	validateSpecs({ ...specs, minimum: 42 })
	validateSpecs({ ...specs, minimum: { value: 42 }})
	validateSpecs({ ...specs, minimum: { exclusive: false, value: 42 }})
	validateSpecs({ ...specs, minimum: { exclusive: true, value: 42 }})

	for (const invalidValue of [false, true, "Hello world!"]) {
		var error = t.throws(() => {
			validateSpecs({ ...specs, minimum: invalidValue })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['minimum'])
		t.is(error.message, "value must be either a number or an object")
	}

	var error = t.throws(() => {
		validateSpecs({ ...specs, minimum: { exclusive: false}})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['minimum'])
	t.is(error.message, "'value' property is missing")

	for (const invalidValue of [42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateSpecs({ ...specs, minimum: { exclusive: invalidValue, value: 42 }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['minimum', 'exclusive'])
		t.is(error.message, "value must be a bool")
	}

	for (const invalidValue of [false, true, "Hello world!"]) {
		var error = t.throws(() => {
			validateSpecs({ ...specs, minimum: { exclusive: false, value: invalidValue }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['minimum', 'value'])
		t.is(error.message, "value must be a number")
	}

	var error = t.throws(() => {
		validateSpecs({ ...specs, minimum: { value: false, foo: 'bar' }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['minimum'])
	t.is(error.message, "'foo' property is unexpected")

	// test 'maximum' property
	validateSpecs({ ...specs, maximum: 42 })
	validateSpecs({ ...specs, maximum: { value: 42 }})
	validateSpecs({ ...specs, maximum: { exclusive: false, value: 42 }})
	validateSpecs({ ...specs, maximum: { exclusive: true, value: 42 }})

	for (const invalidValue of [false, true, "Hello world!"]) {
		var error = t.throws(() => {
			validateSpecs({ ...specs, maximum: invalidValue })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['maximum'])
		t.is(error.message, "value must be either a number or an object")
	}

	var error = t.throws(() => {
		validateSpecs({ ...specs, maximum: { exclusive: false}})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['maximum'])
	t.is(error.message, "'value' property is missing")

	for (const invalidValue of [42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateSpecs({ ...specs, maximum: { exclusive: invalidValue, value: 42 }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['maximum', 'exclusive'])
		t.is(error.message, "value must be a bool")
	}

	for (const invalidValue of [false, true, "Hello world!"]) {
		var error = t.throws(() => {
			validateSpecs({ ...specs, maximum: { exclusive: false, value: invalidValue }})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['maximum', 'value'])
		t.is(error.message, "value must be a number")
	}

	var error = t.throws(() => {
		validateSpecs({ ...specs, maximum: { value: false, foo: 'bar' }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['maximum'])
	t.is(error.message, "'foo' property is unexpected")

	// test minimum must be lower than maximum
	for (const [minimum, maximum] of [[42, 0], [-9, -10], [1, -1]]) {
		var error = t.throws(() => {
			validateSpecs({ ...specs, minimum, maximum })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "minimum must be lower than maximum")
	}

	// test the 'option' property
	optionPropertyTest(t, specs, [])

	// test additional properties
	additionalPropertiesTest(t, specs)

	// test lazy validation
	var specs = {
		type: 'number',
		decimal: 'foo',
		minimum: false,
		maximum: "Hello world!",
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateSpecs(specs, errors)

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
	// test minimal specs
	var specs = { type: 'string' }
	validateSpecs(specs)

	// test 'name' and 'description' properties
	namePropertyTest(t, specs)
	descriptionPropertyTest(t, specs)

	// test the 'length' property
	lengthPropertyTest(t, specs)

	// test the 'pattern' property
	validateSpecs({ ...specs, pattern: "^[a-z]+(-[a-z]+)*$"})
	stringValuePropertyTest(t, specs, 'pattern', [])

	// test the 'option' property
	optionPropertyTest(t, specs, [])

	// test additional properties
	additionalPropertiesTest(t, specs)

	// test lazy validation
	var specs = {
		type: 'string',
		length: false,
		pattern: 42,
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateSpecs(specs, errors)

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
	// test minimal specs
	var specs = {
		type: 'array',
		value: {
			type: 'string'
		}
	}

	missingPropertyTest(t, { type: 'array' }, 'value')

	validateSpecs({ type: 'array', value: { type: 'flag' }})
	validateSpecs({ type: 'array', value: { type: 'number' }})
	validateSpecs(specs)

	// test 'name' and 'description' properties
	namePropertyTest(t, specs)
	descriptionPropertyTest(t, specs)

	// test the 'value' property
	var error = t.throws(() => {
		validateSpecs({ type: 'array', value: { type: 'foo' } })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['[]'])
	t.is(error.message, "value of 'type' is incorrect")

	// test the 'length' property
	lengthPropertyTest(t, specs)

	// test the 'option' property
	optionPropertyTest(t, specs, [])

	// test additional properties
	additionalPropertiesTest(t, specs)

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
	validateSpecs(nestedArrays)

	// test lazy validation
	var specs = {
		type: 'array',
        value: 42,
		length: false,
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateSpecs(specs, errors)

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
	// test minimal specs
	var specs = {
		type: 'object',
		key: 'string',
		value: {
			type: 'string'
		}
	}
	validateSpecs(specs)

	missingPropertyTest(t, {type: 'object', value: { type: 'string'}}, 'key')
	missingPropertyTest(t, {type: 'object', key: 'string'}, 'value')

	// test 'name' and 'description' properties
	namePropertyTest(t, specs)
	descriptionPropertyTest(t, specs)

	// test the 'key' property
	for (const key of ['integer', 'string']) {
		validateSpecs({ type: 'object', key: key, value: { type: 'string' } })
	}

	var error = t.throws(() => {
		validateSpecs({ type: 'object', key: 'foo', value: { type: 'string' } })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value of 'key' must be either 'integer' or 'string'")

	// test the 'value' property
	var error = t.throws(() => {
		validateSpecs({ type: 'object', value: { type: 'foo' } })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['{}'])
	t.is(error.message, "value of 'type' is incorrect")

	// test the 'length' property
	lengthPropertyTest(t, specs)

	// test the 'option' property
	optionPropertyTest(t, specs, [])

	// test additional properties
	additionalPropertiesTest(t, specs)

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
	validateSpecs(nestedObjects)

	// test lazy validation
	var specs = {
		type: 'object',
		key: 'foo',
        value: 42,
		length: false,
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateSpecs(specs, errors)

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
	// test minimal specs
	var specs = {
		type: 'tuple',
		items: [
			{ type: 'flag' },
			{ type: 'number' },
			{ type: 'string' }
		]
	}
	validateSpecs(specs)
	missingPropertyTest(t, { type: 'tuple'}, 'items')

	// test 'name' and 'description' properties
	namePropertyTest(t, specs)
	descriptionPropertyTest(t, specs)

	// test the 'items' property
	for (const value in [false, true, 42, 42.5, "Hello world!"]) {
		const error = t.throws(() => {
			validateSpecs({ type: 'tuple', items: value })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['items'])
		t.is(error.message, "value must be an array")
	}

	var error = t.throws(() => {
		validateSpecs({ type: 'tuple', items: [] })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['items'])
	t.is(error.message, "must contain at least one value")

	for (const value in [false, true, 42, 42.5, "Hello world!"]) {
		const error = t.throws(() => {
			validateSpecs({ type: 'tuple', items: [value] })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['<0>'])
		t.is(error.message, "value must be an object")
	}

	error = t.throws(() => {
		validateSpecs({ type: 'tuple', items: [{ type: 'foo' }] })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['<0>'])
	t.is(error.message, "value of 'type' is incorrect")

	// test the 'option' property
	optionPropertyTest(t, specs, [])

	// test additional properties
	additionalPropertiesTest(t, specs)

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
	validateSpecs(nestedTuples)

	// test lazy validation
	var specs = {
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
	validateSpecs(specs, errors)

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
	// test minimal specs
	var specs = {
		type: 'map',
		fields: {
			foo: { type: 'flag' },
			bar: { type: 'number' },
			quz: { type: 'string' }
		}
	}
	validateSpecs(specs)
	missingPropertyTest(t, { type: 'map'}, 'fields')

	// test 'name' and 'description' properties
	namePropertyTest(t, specs)
	descriptionPropertyTest(t, specs)

	// test the 'fields' property
	for (const value in [false, true, 42, 42.5, "Hello world!"]) {
		const error = t.throws(() => {
			validateSpecs({ type: 'map', fields: value })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['fields'])
		t.is(error.message, "value must be an object")
	}

	var error = t.throws(() => {
		validateSpecs({ type: 'map', fields: {} })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['fields'])
	t.is(error.message, "must contain at least one field")

	for (const name of VALID_NAMES) {
		const specs = {
			type: 'map',
			fields: {
				[name]: {
					type: 'flag'
				}
			}
		}
		validateSpecs(specs)
	}

	for (const name of INVALID_NAMES) {
		const specs = {
			type: 'map',
			fields: {
				[name]: {
					type: 'flag'
				}
			}
		}

		const error = t.throws(() => {
			validateSpecs(specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['fields'])
		t.is(error.message, `'${name}' is an incorrect key name`)
	}

	for (const value in [false, true, 42, 42.5, "Hello world!"]) {
		const error = t.throws(() => {
			validateSpecs({ type: 'map', fields: { foo: value } })
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['$foo'])
		t.is(error.message, "value must be an object")
	}

	error = t.throws(() => {
		validateSpecs({ type: 'map', fields: { foo: { type: 'bar' } }})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['$foo'])
	t.is(error.message, "value of 'type' is incorrect")

	// test the 'option' property
	optionPropertyTest(t, specs, [])

	// test additional properties
	additionalPropertiesTest(t, specs)

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
	validateSpecs(nestedMaps)

	// test lazy validation
	var specs = {
		type: 'map',
        fields: {
			'@foo': { type: 'flag' },
			bar: { type: 'foo' }
		},
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateSpecs(specs, errors)

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
	// test minimal specs
	var specs = {
		type: 'enum',
		values: ['foo', 'bar', 'quz']
	}
	validateSpecs(specs)

	var error = t.throws(() => {
		validateSpecs({type: 'enum'})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "'values' property is missing")

	// test the 'values' property
	for (const value in [true, false, 42, 42.5, "Hello world!"]) {
		var error = t.throws(() => {
			validateSpecs({type: 'enum', values: value})
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, ['values'])
		t.is(error.message, "value must be an array")
	}

	var error = t.throws(() => {
		validateSpecs({type: 'enum', values: []})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['values'])
	t.is(error.message, "must contain at least one value")

	var error = t.throws(() => {
		validateSpecs({type: 'enum', values: ['@foo', 'bar', 'quz']})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['values'])
	t.is(error.message, "'@foo' is an incorrect value")

	var error = t.throws(() => {
		validateSpecs({type: 'enum', values: ['foo', 'bar', 'quz', 'foo']})
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, ['values'])
	t.is(error.message, "'foo' value is duplicated")

	// test the 'option' property
	optionPropertyTest(t, specs, [])

	// test additional properties
	additionalPropertiesTest(t, specs)

	// test 'name' and 'description' properties
	namePropertyTest(t, specs)
	descriptionPropertyTest(t, specs)

	// test lazy validation
	var specs = {
		type: 'enum',
        values: ['@foo', 'bar', 'quz', 'bar'],
        option: 42,
        foo: 'bar'
	}

	var errors = []
	validateSpecs(specs, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "'foo' property is unexpected")
	t.deepEqual(errors[1].path, ['values'])
	t.is(errors[1].message, "'@foo' is an incorrect value")
	t.deepEqual(errors[2].path, ['values'])
	t.is(errors[2].message, "'bar' value is duplicated")
	t.deepEqual(errors[3].path, ['option'])
	t.is(errors[3].message, "value must be a bool")
})

