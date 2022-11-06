#!/usr/bin/env node
"use strict";
// https://github.com/bufbuild/protobuf-es/tree/main/packages/protoc-gen-es/src/typescript.ts
Object.defineProperty(exports, "__esModule", { value: true });
const protobuf_1 = require("@bufbuild/protobuf");
const protoplugin_1 = require("@bufbuild/protoplugin");
// @ts-ignore
const package_json_1 = require("../package.json");
function generateTs(schema) {
    for (const file of schema.files) {
        const filename = file.name + '_interface.pb.ts';
        const g = schema.generateFile(filename);
        // todo
        // for (const enumeration of file.enums)
        //   generateEnum(schema, g, enumeration);
        for (const m of file.messages)
            generateMessage(g, m);
    }
}
function generateMessage(g, message) {
    g.print('export interface ', message.name, ' {');
    for (const field of message.members) {
        if (field.kind === 'field') {
            g.print('  ', field.name, '?: ', fieldType(g, field), ';');
        }
        else {
            // todo: oneof
        }
    }
    g.print('}');
    g.print();
    // todo
    // for (const nestedEnum of message.nestedEnums)
    //   generateEnum(schema, g, nestedEnum);
    for (const m of message.nestedMessages)
        generateMessage(g, m);
}
function fieldType(g, field) {
    const singularType = fieldSingularType(g, field);
    return field.repeated ? singularType + '[]' : singularType;
}
function fieldSingularType(g, field) {
    switch (field.fieldKind) {
        case 'scalar':
            return scalarType(field.scalar);
        case 'message':
            return objectType(g, field.message);
        case 'enum':
            return objectType(g, field.enum);
        case 'map': {
            let k, v;
            switch (field.mapKey) {
                case protobuf_1.ScalarType.FIXED32:
                case protobuf_1.ScalarType.INT32:
                case protobuf_1.ScalarType.SFIXED32:
                case protobuf_1.ScalarType.SINT32:
                case protobuf_1.ScalarType.UINT32:
                    k = 'number';
                    break;
                default:
                    k = 'string';
            }
            switch (field.mapValue.kind) {
                case 'scalar':
                    v = scalarType(field.mapValue.scalar);
                    break;
                case 'message':
                    v = objectType(g, field.mapValue.message);
                    break;
                case 'enum':
                    v = objectType(g, field.mapValue.enum);
                    break;
            }
            return `Map<${k}, ${v}>`;
        }
    }
}
function scalarType(type) {
    switch (type) {
        case protobuf_1.ScalarType.STRING:
            return 'string';
        case protobuf_1.ScalarType.BOOL:
            return 'boolean';
        default:
            return 'number';
    }
}
function objectType(g, field) {
    return g.import(field).toTypeOnly().name;
}
(0, protoplugin_1.runNodeJs)((0, protoplugin_1.createEcmaScriptPlugin)({ name: package_json_1.name, version: package_json_1.version, generateTs }));
