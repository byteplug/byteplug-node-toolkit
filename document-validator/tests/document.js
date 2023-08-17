// Copyright (c) 2022-2023, Byteplug LLC.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, August 2022

import test from 'ava'
import { documentToObject, ValidationError } from '../src/index.js'

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

test('flag-type', t => {
	const specs = { type: 'flag' }

	for (const value in ['42', '42.0', '"Hello world!"', '[]', '{}']) {
		var error = t.throws(() => {
			documentToObject(value, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON boolean")
	}

	var object = documentToObject('false', specs)
	t.is(object, false)

	var object = documentToObject('true', specs)
	t.is(object, true)
})

test('number-type', t => {
	var specs = { type: 'number' }

	for (const value of ['false', 'true', '"Hello world!"', '[]', '{}']) {
		var error = t.throws(() => {
			documentToObject(value, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON number")
	}

	var object = documentToObject('42', specs)
	t.is(object, 42)

	var object = documentToObject('42.5', specs)
	t.is(object, 42.5)

	// test if value is being checked against decimal restriction
	var error = t.throws(() => {
		documentToObject('42.5', { ...specs, decimal: false })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "was expecting non-decimal number")

	// test if value is being checked against minimum value
	var specs = {
		type: 'number',
		minimum: 42
	}

	documentToObject('42', specs)
	var error = t.throws(() => {
		documentToObject('41', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be equal or greater than 42")

	var specs = {
		type: 'number',
		minimum: {
			exclusive: false,
			value: 42
		}
	}

	documentToObject('42', specs)
	var error = t.throws(() => {
		documentToObject('41', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be equal or greater than 42")

	var specs = {
		type: 'number',
		minimum: {
			exclusive: true,
			value: 42
		}
	}

	documentToObject('43', specs)
	var error = t.throws(() => {
		documentToObject('42', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be strictly greater than 42")

	// test if value is being checked against maximum value
	var specs = {
		type: 'number',
		maximum: 42
	}

	documentToObject('42', specs)
	var error = t.throws(() => {
		documentToObject('43', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be equal or lower than 42")

	var specs = {
		type: 'number',
		maximum: {
			exclusive: false,
			value: 42
		}
	}

	documentToObject('42', specs)
	var error = t.throws(() => {
		documentToObject('43', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be equal or lower than 42")

	var specs = {
		type: 'number',
		maximum: {
			exclusive: true,
			value: 42
		}
	}

	documentToObject('41', specs)
	var error = t.throws(() => {
		documentToObject('42', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be strictly lower than 42")

	// test lazy validation
	var specs = {
		type: 'number',
		minimum: 43,
		maximum: 41
	}

	var errors = []
	documentToObject('42', specs, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "value must be equal or greater than 43")
	t.deepEqual(errors[1].path, [])
	t.is(errors[1].message, "value must be equal or lower than 41")
})

test('string-type', t => {
	var specs = { type: 'string' }

	for (const value of ['false', 'true', '42', '42.5', '[]', '{}']) {
		var error = t.throws(() => {
			documentToObject(value, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON string")
	}

	var object = documentToObject('"Hello world!"', specs)
	t.is(object, "Hello world!")

	// test if value is being checked against length value
	var specs = {
		type: 'string',
		length: 42
	}

	var value = 'a'.repeat(42)
	documentToObject(`"${value}"`, specs)

	var error = t.throws(() => {
		var value = 'a'.repeat(41)
		documentToObject(`"${value}"`, specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 42")

	var error = t.throws(() => {
		var value = 'a'.repeat(43)
		documentToObject(`"${value}"`, specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 42")

	var specs = {
		type: 'string',
		length: {
			minimum: 42
		}
	}

	var value = 'a'.repeat(42)
	documentToObject(`"${value}"`, specs)

	var error = t.throws(() => {
		var value = 'a'.repeat(41)
		documentToObject(`"${value}"`, specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or greater than 42")

	var specs = {
		type: 'string',
		length: {
			maximum: 42
		}
	}

	var value = 'a'.repeat(42)
	documentToObject(`"${value}"`, specs)

	var error = t.throws(() => {
		var value = 'a'.repeat(43)
		documentToObject(`"${value}"`, specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or lower than 42")

	// test if value is being checked against the pattern
	var specs = {
		type: 'string',
		pattern: '^[a-z]+(-[a-z]+)*$'
	}

	for (const validValue of ["foobar", "foo-bar"]) {
		documentToObject(`"${validValue}"`, specs)
	}

	for (const invalidValue of ["Foobar", "foo_bar", "-foobar", "barfoo-", "foo--bar"]) {
		var error = t.throws(() => {
			documentToObject(`"${invalidValue}"`, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "value did not match the pattern")
	}

	// test lazy validation
	var specs = {
		type: 'string',
		length: 42,
		pattern: '^[b-z]+$'
	}

	var errors = []

	var value = 'a'.repeat(43)
	documentToObject(`"${value}"`, specs, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "length must be equal to 42")
	t.deepEqual(errors[1].path, [])
	t.is(errors[1].message, "value did not match the pattern")
})

test('array-type', t => {
	var specs = {
		type: 'array',
		value: {
			type: 'string'
	}}

	for (const value of ['false', 'true', '42', '42.5', '"Hello world!"', '{}']) {
		var error = t.throws(() => {
			documentToObject(value, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON array")
	}

	var specs = { type: 'array', value: { type: 'flag' } }
	var object = documentToObject('[true, false, true]', specs)
	t.deepEqual(object, [true, false, true])

	var specs = { type: 'array', value: { type: 'number' } }
	var object = documentToObject('[10, 42, 99.5]', specs)
	t.deepEqual(object, [10, 42, 99.5])

	var specs = { type: 'array', value: { type: 'string' } }
	var object = documentToObject('["foo", "bar", "quz"]', specs)
	t.deepEqual(object, ["foo", "bar", "quz"])

	// test if array items are being checked against length value
	var specs = {
		type: 'array',
		value: { type: 'string' },
		length: 2
	}

	var object = documentToObject('["foo", "bar"]', specs)
	var error = t.throws(() => {
		documentToObject('["foo"]', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 2")

	var error = t.throws(() => {
		documentToObject('["foo", "bar", "quz"]', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 2")

	var specs = {
		type: 'array',
		value: { type: 'string' },
		length: {
			minimum: 2
		}
	}

	var object = documentToObject('["foo", "bar"]', specs)

	var error = t.throws(() => {
		documentToObject('["foo"]', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or greater than 2")

	var specs = {
		type: 'array',
		value: { type: 'string' },
		length: {
			maximum: 2
		}
	}

	var object = documentToObject('["foo", "bar"]', specs)

	var error = t.throws(() => {
		documentToObject('["foo", "bar", "quz"]', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or lower than 2")

	// test lazy validation
	var specs = {
		type: 'array',
		value: {
			type: 'number'
		}
	}

	var errors = []
	documentToObject('[true, 42, "Hello world!"]', specs, errors)

	t.deepEqual(errors[0].path, ["[0]"])
	t.is(errors[0].message, "was expecting a JSON number")
	t.deepEqual(errors[1].path, ["[2]"])
	t.is(errors[1].message, "was expecting a JSON number")
})

test('object-type', t => {
	var specs = {
		type: 'object',
		key: 'string',
		value: {
			type: 'string',
		}
	}

	for (const value of ['false', 'true', '42', '42.5', '"Hello world!"', '[]']) {
		var error = t.throws(() => {
			documentToObject(value, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON object")
	}

	// test with key set to 'integer' (key order is not guaranteed; some tests
	// will likely fail on old browsers)
	var specs = {
		type: 'object',
		key: 'integer',
		value: {
			type: 'string'
		}
	}

	var object = documentToObject('{"1": "foo", "2": "bar", "3": "quz"}', specs)
	t.deepEqual(object, {1: "foo", 2: "bar", 3: "quz"})

	var error = t.throws(() => {
		documentToObject('{"1": "foo", "2.5": "bar", "3": "quz"}', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "key at index 2 is invalid; expected it to be an integer")

	var error = t.throws(() => {
		documentToObject('{"1": "foo", "bar": "bar", "3": "quz"}', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "key at index 2 is invalid; expected it to be an integer")

	// test with key set to 'string'
	var specs = {
		type: 'object',
		key: 'string',
		value: {
			type: 'number'
		}
	}

	for (const name of VALID_NAMES) {
		var object = documentToObject(`{"foo": 10, "${name}": 42, "quz": 99.5}`, specs)
		t.deepEqual(object, {"foo": 10, [name]: 42, "quz": 99.5})
	}

	for (const name of INVALID_NAMES) {
		var error = t.throws(() => {
			documentToObject(`{"foo": 10, "${name}": 42, "quz": 99.5}`, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "key at index 1 is invalid; expected to match the pattern")
	}

	// test if object items are being checked against length value
	var specs = {
		type: 'object',
		key: 'string',
		value: { type: 'number' },
		length: 2
	}

	documentToObject('{"foo": 1, "bar": 2}', specs)

	var error = t.throws(() => {
		documentToObject('{"foo": 1}', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 2")

	var error = t.throws(() => {
		documentToObject('{"foo": 1, "bar": 2, "quz": 3}', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 2")

	var specs = {
		type: 'object',
		key: 'string',
		value: { type: 'number' },
		length: {
			minimum: 2
		}
	}

	documentToObject('{"foo": 1, "bar": 2}', specs)

	var error = t.throws(() => {
		documentToObject('{"foo": 1}', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or greater than 2")

	var specs = {
		type: 'object',
		key: 'string',
		value: { type: 'number' },
		length: {
			maximum: 2
		}
	}

	documentToObject('{"foo": 1, "bar": 2}', specs)

	var error = t.throws(() => {
		documentToObject('{"foo": 1, "bar": 2, "quz": 3}', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or lower than 2")

	// test lazy validation
	var specs = {
		type: 'object',
		key: 'string',
		value: {
			type: 'number'
		}
	}

	var errors = []
	documentToObject('{"foo": true, "bar": 42, "quz": "Hello world!"}', specs, errors)

	t.deepEqual(errors[0].path, ["{foo}"])
	t.is(errors[0].message, "was expecting a JSON number")
	t.deepEqual(errors[1].path, ["{quz}"])
	t.is(errors[1].message, "was expecting a JSON number")
})

test('tuple-type', t => {
	var specs = {
		type: 'tuple',
		items: [
			{ type: 'flag' },
			{ type: 'number' },
			{ type: 'string' }
		]
	}

	for (const value of ['false', 'true', '42', '42.5', '"Hello world!"', '{}']) {
		var error = t.throws(() => {
			documentToObject(value, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON array")
	}

	var object = documentToObject('[true, 42, "foo"]', specs)
	t.deepEqual(object, [true, 42, "foo"])

	var error = t.throws(() => {
		documentToObject('[false, true, 42, "foo"]', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length of the array must be 3")

	// test lazy validation
	var errors = []
	documentToObject('["foo", true, 42]', specs, errors)

	t.deepEqual(errors[0].path, ['<0>'])
	t.is(errors[0].message, "was expecting a JSON boolean")
	t.deepEqual(errors[1].path, ['<1>'])
	t.is(errors[1].message, "was expecting a JSON number")
	t.deepEqual(errors[2].path, ['<2>'])
	t.is(errors[2].message, "was expecting a JSON string")
})

test('map-type', t => {
	var specs = {
		type: 'map',
		fields: {
			'foo': { type: 'flag' },
			'bar': { type: 'number', option: true },
			'quz': { type: 'string' }
		}
	}

	for (const value of ['false', 'true', '42', '42.5', '"Hello world!"', '[]']) {
		var error = t.throws(() => {
			documentToObject(value, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON object")
	}

	var object = documentToObject('{"foo": true, "bar": 42, "quz": "Hello world!"}', specs)
	t.deepEqual(object, {
		"foo": true,
		"bar": 42,
		"quz": "Hello world!"
	})

	// test if unexpected fields are reported
	var error = t.throws(() => {
		documentToObject('{"foo": true, "bar": 42, "quz": "Hello world!", "yolo": false}', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "'yolo' field was unexpected")

	// test if missing fields are reported
	var error = t.throws(() => {
		documentToObject('{"foo": true, "bar": 42}', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "'quz' field was missing")

	// test if missing optional fields are NOT reported
	var object = documentToObject('{"foo": true, "quz": "Hello world!"}', specs)
	t.deepEqual(object, {
		"foo": true,
		"bar": null,
		"quz": "Hello world!"
	})

	// test lazy validation
	var errors = []
	documentToObject('{"foo": "Hello world!", "bar": true, "quz": 42}', specs, errors)

	t.deepEqual(errors[0].path, ['$foo'])
	t.is(errors[0].message, "was expecting a JSON boolean")
	t.deepEqual(errors[1].path, ['$bar'])
	t.is(errors[1].message, "was expecting a JSON number")
	t.deepEqual(errors[2].path, ['$quz'])
	t.is(errors[2].message, "was expecting a JSON string")
})

test('enum-type', t => {
	const specs = {
		type: 'enum',
		values: ['foo', 'bar', 'quz']
	}

	for (const value of ['false', 'true', '42', '42.0', '[]', '{}']) {
		var error = t.throws(() => {
			documentToObject(value, specs)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON string")
	}

	for (const value of ['foo', 'bar', 'quz']) {
		var object = documentToObject(`"${value}"`, specs)
		t.is(object, value)
	}

	// test if value is being checked against the valid values
	var error = t.throws(() => {
		documentToObject('"Hello world!"', specs)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "enum value is invalid")
})
