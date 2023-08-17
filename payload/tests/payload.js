// Copyright (c) 2022-2023, Byteplug LLC.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, August 2022

import test from 'ava'
import { payloadToObject, ValidationError } from '../src/index.js'

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
	const format = { type: 'flag' }

	for (const value in ['42', '42.0', '"Hello world!"', '[]', '{}']) {
		var error = t.throws(() => {
			payloadToObject(value, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON boolean")
	}

	var object = payloadToObject('false', format)
	t.is(object, false)

	var object = payloadToObject('true', format)
	t.is(object, true)
})

test('number-type', t => {
	var format = { type: 'number' }

	for (const value of ['false', 'true', '"Hello world!"', '[]', '{}']) {
		var error = t.throws(() => {
			payloadToObject(value, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON number")
	}

	var object = payloadToObject('42', format)
	t.is(object, 42)

	var object = payloadToObject('42.5', format)
	t.is(object, 42.5)

	// test if value is being checked against decimal restriction
	var error = t.throws(() => {
		payloadToObject('42.5', { ...format, decimal: false })
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "was expecting non-decimal number")

	// test if value is being checked against minimum value
	var format = {
		type: 'number',
		minimum: 42
	}

	payloadToObject('42', format)
	var error = t.throws(() => {
		payloadToObject('41', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be equal or greater than 42")

	var format = {
		type: 'number',
		minimum: {
			exclusive: false,
			value: 42
		}
	}

	payloadToObject('42', format)
	var error = t.throws(() => {
		payloadToObject('41', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be equal or greater than 42")

	var format = {
		type: 'number',
		minimum: {
			exclusive: true,
			value: 42
		}
	}

	payloadToObject('43', format)
	var error = t.throws(() => {
		payloadToObject('42', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be strictly greater than 42")

	// test if value is being checked against maximum value
	var format = {
		type: 'number',
		maximum: 42
	}

	payloadToObject('42', format)
	var error = t.throws(() => {
		payloadToObject('43', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be equal or lower than 42")

	var format = {
		type: 'number',
		maximum: {
			exclusive: false,
			value: 42
		}
	}

	payloadToObject('42', format)
	var error = t.throws(() => {
		payloadToObject('43', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be equal or lower than 42")

	var format = {
		type: 'number',
		maximum: {
			exclusive: true,
			value: 42
		}
	}

	payloadToObject('41', format)
	var error = t.throws(() => {
		payloadToObject('42', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "value must be strictly lower than 42")

	// test lazy validation
	var format = {
		type: 'number',
		minimum: 43,
		maximum: 41
	}

	var errors = []
	payloadToObject('42', format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "value must be equal or greater than 43")
	t.deepEqual(errors[1].path, [])
	t.is(errors[1].message, "value must be equal or lower than 41")
})

test('string-type', t => {
	var format = { type: 'string' }

	for (const value of ['false', 'true', '42', '42.5', '[]', '{}']) {
		var error = t.throws(() => {
			payloadToObject(value, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON string")
	}

	var object = payloadToObject('"Hello world!"', format)
	t.is(object, "Hello world!")

	// test if value is being checked against length value
	var format = {
		type: 'string',
		length: 42
	}

	var value = 'a'.repeat(42)
	payloadToObject(`"${value}"`, format)

	var error = t.throws(() => {
		var value = 'a'.repeat(41)
		payloadToObject(`"${value}"`, format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 42")

	var error = t.throws(() => {
		var value = 'a'.repeat(43)
		payloadToObject(`"${value}"`, format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 42")

	var format = {
		type: 'string',
		length: {
			minimum: 42
		}
	}

	var value = 'a'.repeat(42)
	payloadToObject(`"${value}"`, format)

	var error = t.throws(() => {
		var value = 'a'.repeat(41)
		payloadToObject(`"${value}"`, format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or greater than 42")

	var format = {
		type: 'string',
		length: {
			maximum: 42
		}
	}

	var value = 'a'.repeat(42)
	payloadToObject(`"${value}"`, format)

	var error = t.throws(() => {
		var value = 'a'.repeat(43)
		payloadToObject(`"${value}"`, format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or lower than 42")

	// test if value is being checked against the pattern
	var format = {
		type: 'string',
		pattern: '^[a-z]+(-[a-z]+)*$'
	}

	for (const validValue of ["foobar", "foo-bar"]) {
		payloadToObject(`"${validValue}"`, format)
	}

	for (const invalidValue of ["Foobar", "foo_bar", "-foobar", "barfoo-", "foo--bar"]) {
		var error = t.throws(() => {
			payloadToObject(`"${invalidValue}"`, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "value did not match the pattern")
	}

	// test lazy validation
	var format = {
		type: 'string',
		length: 42,
		pattern: '^[b-z]+$'
	}

	var errors = []

	var value = 'a'.repeat(43)
	payloadToObject(`"${value}"`, format, errors)

	t.deepEqual(errors[0].path, [])
	t.is(errors[0].message, "length must be equal to 42")
	t.deepEqual(errors[1].path, [])
	t.is(errors[1].message, "value did not match the pattern")
})

test('array-type', t => {
	var format = {
		type: 'array',
		value: {
			type: 'string'
	}}

	for (const value of ['false', 'true', '42', '42.5', '"Hello world!"', '{}']) {
		var error = t.throws(() => {
			payloadToObject(value, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON array")
	}

	var format = { type: 'array', value: { type: 'flag' } }
	var object = payloadToObject('[true, false, true]', format)
	t.deepEqual(object, [true, false, true])

	var format = { type: 'array', value: { type: 'number' } }
	var object = payloadToObject('[10, 42, 99.5]', format)
	t.deepEqual(object, [10, 42, 99.5])

	var format = { type: 'array', value: { type: 'string' } }
	var object = payloadToObject('["foo", "bar", "quz"]', format)
	t.deepEqual(object, ["foo", "bar", "quz"])

	// test if array items are being checked against length value
	var format = {
		type: 'array',
		value: { type: 'string' },
		length: 2
	}

	var object = payloadToObject('["foo", "bar"]', format)
	var error = t.throws(() => {
		payloadToObject('["foo"]', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 2")

	var error = t.throws(() => {
		payloadToObject('["foo", "bar", "quz"]', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 2")

	var format = {
		type: 'array',
		value: { type: 'string' },
		length: {
			minimum: 2
		}
	}

	var object = payloadToObject('["foo", "bar"]', format)

	var error = t.throws(() => {
		payloadToObject('["foo"]', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or greater than 2")

	var format = {
		type: 'array',
		value: { type: 'string' },
		length: {
			maximum: 2
		}
	}

	var object = payloadToObject('["foo", "bar"]', format)

	var error = t.throws(() => {
		payloadToObject('["foo", "bar", "quz"]', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or lower than 2")

	// test lazy validation
	var format = {
		type: 'array',
		value: {
			type: 'number'
		}
	}

	var errors = []
	payloadToObject('[true, 42, "Hello world!"]', format, errors)

	t.deepEqual(errors[0].path, ["[0]"])
	t.is(errors[0].message, "was expecting a JSON number")
	t.deepEqual(errors[1].path, ["[2]"])
	t.is(errors[1].message, "was expecting a JSON number")
})

test('object-type', t => {
	var format = {
		type: 'object',
		key: 'string',
		value: {
			type: 'string',
		}
	}

	for (const value of ['false', 'true', '42', '42.5', '"Hello world!"', '[]']) {
		var error = t.throws(() => {
			payloadToObject(value, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON object")
	}

	// test with key set to 'integer' (key order is not guaranteed; some tests
	// will likely fail on old browsers)
	var format = {
		type: 'object',
		key: 'integer',
		value: {
			type: 'string'
		}
	}

	var object = payloadToObject('{"1": "foo", "2": "bar", "3": "quz"}', format)
	t.deepEqual(object, {1: "foo", 2: "bar", 3: "quz"})

	var error = t.throws(() => {
		payloadToObject('{"1": "foo", "2.5": "bar", "3": "quz"}', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "key at index 2 is invalid; expected it to be an integer")

	var error = t.throws(() => {
		payloadToObject('{"1": "foo", "bar": "bar", "3": "quz"}', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "key at index 2 is invalid; expected it to be an integer")

	// test with key set to 'string'
	var format = {
		type: 'object',
		key: 'string',
		value: {
			type: 'number'
		}
	}

	for (const name of VALID_NAMES) {
		var object = payloadToObject(`{"foo": 10, "${name}": 42, "quz": 99.5}`, format)
		t.deepEqual(object, {"foo": 10, [name]: 42, "quz": 99.5})
	}

	for (const name of INVALID_NAMES) {
		var error = t.throws(() => {
			payloadToObject(`{"foo": 10, "${name}": 42, "quz": 99.5}`, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "key at index 1 is invalid; expected to match the pattern")
	}

	// test if object items are being checked against length value
	var format = {
		type: 'object',
		key: 'string',
		value: { type: 'number' },
		length: 2
	}

	payloadToObject('{"foo": 1, "bar": 2}', format)

	var error = t.throws(() => {
		payloadToObject('{"foo": 1}', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 2")

	var error = t.throws(() => {
		payloadToObject('{"foo": 1, "bar": 2, "quz": 3}', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal to 2")

	var format = {
		type: 'object',
		key: 'string',
		value: { type: 'number' },
		length: {
			minimum: 2
		}
	}

	payloadToObject('{"foo": 1, "bar": 2}', format)

	var error = t.throws(() => {
		payloadToObject('{"foo": 1}', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or greater than 2")

	var format = {
		type: 'object',
		key: 'string',
		value: { type: 'number' },
		length: {
			maximum: 2
		}
	}

	payloadToObject('{"foo": 1, "bar": 2}', format)

	var error = t.throws(() => {
		payloadToObject('{"foo": 1, "bar": 2, "quz": 3}', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length must be equal or lower than 2")

	// test lazy validation
	var format = {
		type: 'object',
		key: 'string',
		value: {
			type: 'number'
		}
	}

	var errors = []
	payloadToObject('{"foo": true, "bar": 42, "quz": "Hello world!"}', format, errors)

	t.deepEqual(errors[0].path, ["{foo}"])
	t.is(errors[0].message, "was expecting a JSON number")
	t.deepEqual(errors[1].path, ["{quz}"])
	t.is(errors[1].message, "was expecting a JSON number")
})

test('tuple-type', t => {
	var format = {
		type: 'tuple',
		items: [
			{ type: 'flag' },
			{ type: 'number' },
			{ type: 'string' }
		]
	}

	for (const value of ['false', 'true', '42', '42.5', '"Hello world!"', '{}']) {
		var error = t.throws(() => {
			payloadToObject(value, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON array")
	}

	var object = payloadToObject('[true, 42, "foo"]', format)
	t.deepEqual(object, [true, 42, "foo"])

	var error = t.throws(() => {
		payloadToObject('[false, true, 42, "foo"]', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "length of the array must be 3")

	// test lazy validation
	var errors = []
	payloadToObject('["foo", true, 42]', format, errors)

	t.deepEqual(errors[0].path, ['<0>'])
	t.is(errors[0].message, "was expecting a JSON boolean")
	t.deepEqual(errors[1].path, ['<1>'])
	t.is(errors[1].message, "was expecting a JSON number")
	t.deepEqual(errors[2].path, ['<2>'])
	t.is(errors[2].message, "was expecting a JSON string")
})

test('map-type', t => {
	var format = {
		type: 'map',
		fields: {
			'foo': { type: 'flag' },
			'bar': { type: 'number', option: true },
			'quz': { type: 'string' }
		}
	}

	for (const value of ['false', 'true', '42', '42.5', '"Hello world!"', '[]']) {
		var error = t.throws(() => {
			payloadToObject(value, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON object")
	}

	var object = payloadToObject('{"foo": true, "bar": 42, "quz": "Hello world!"}', format)
	t.deepEqual(object, {
		"foo": true,
		"bar": 42,
		"quz": "Hello world!"
	})

	// test if unexpected fields are reported
	var error = t.throws(() => {
		payloadToObject('{"foo": true, "bar": 42, "quz": "Hello world!", "yolo": false}', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "'yolo' field was unexpected")

	// test if missing fields are reported
	var error = t.throws(() => {
		payloadToObject('{"foo": true, "bar": 42}', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "'quz' field was missing")

	// test if missing optional fields are NOT reported
	var object = payloadToObject('{"foo": true, "quz": "Hello world!"}', format)
	t.deepEqual(object, {
		"foo": true,
		"bar": null,
		"quz": "Hello world!"
	})

	// test lazy validation
	var errors = []
	payloadToObject('{"foo": "Hello world!", "bar": true, "quz": 42}', format, errors)

	t.deepEqual(errors[0].path, ['$foo'])
	t.is(errors[0].message, "was expecting a JSON boolean")
	t.deepEqual(errors[1].path, ['$bar'])
	t.is(errors[1].message, "was expecting a JSON number")
	t.deepEqual(errors[2].path, ['$quz'])
	t.is(errors[2].message, "was expecting a JSON string")
})

test('enum-type', t => {
	const format = {
		type: 'enum',
		values: ['foo', 'bar', 'quz']
	}

	for (const value of ['false', 'true', '42', '42.0', '[]', '{}']) {
		var error = t.throws(() => {
			payloadToObject(value, format)
		}, {instanceOf: ValidationError})

		t.deepEqual(error.path, [])
		t.is(error.message, "was expecting a JSON string")
	}

	for (const value of ['foo', 'bar', 'quz']) {
		var object = payloadToObject(`"${value}"`, format)
		t.is(object, value)
	}

	// test if value is being checked against the valid values
	var error = t.throws(() => {
		payloadToObject('"Hello world!"', format)
	}, {instanceOf: ValidationError})

	t.deepEqual(error.path, [])
	t.is(error.message, "enum value is invalid")
})
