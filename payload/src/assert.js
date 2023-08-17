// Copyright (c) 2022-2023, Byteplug LLC.
//
// This source file is part of the Byteplug toolkit for the JavaScript
// programming language which is released under the OSL-3.0 license. Please
// refer to the LICENSE file that can be found at the root of the project
// directory.
//
// Written by Jonathan De Wachter <jonathan.dewachter@byteplug.io>, July 2022

export default function assert(condition, message) {
    if (!condition) throw new Error(message)
}
