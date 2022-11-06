#!/usr/bin/env node

// https://github.com/bufbuild/protobuf-es/tree/main/packages/protoc-gen-es/src/typescript.ts

import {
  DescEnum,
  DescField,
  DescMessage,
  ScalarType,
} from '@bufbuild/protobuf';
import { createEcmaScriptPlugin, runNodeJs } from '@bufbuild/protoplugin';
import { GeneratedFile, Schema } from '@bufbuild/protoplugin/ecmascript';

// @ts-ignore
import { name, version } from '../package.json';

function generateTs(schema: Schema) {
  for (const file of schema.files) {
    const filename = file.name + '_interface.pb.ts';
    const g = schema.generateFile(filename);

    // todo
    // for (const enumeration of file.enums)
    //   generateEnum(schema, g, enumeration);

    for (const m of file.messages) generateMessage(g, m);
  }
}

function generateMessage(g: GeneratedFile, message: DescMessage) {
  g.print('export interface ', message.name, ' {');

  for (const field of message.members) {
    if (field.kind === 'field') {
      g.print('  ', field.name, '?: ', fieldType(g, field), ';');
    } else {
      // todo: oneof
    }
  }

  g.print('}');
  g.print();

  // todo
  // for (const nestedEnum of message.nestedEnums)
  //   generateEnum(schema, g, nestedEnum);

  for (const m of message.nestedMessages) generateMessage(g, m);
}

function fieldType(g: GeneratedFile, field: DescField): string {
  const singularType = fieldSingularType(g, field);

  return field.repeated ? singularType + '[]' : singularType;
}

function fieldSingularType(g: GeneratedFile, field: DescField): string {
  switch (field.fieldKind) {
    case 'scalar':
      return scalarType(field.scalar);
    case 'message':
      return objectType(g, field.message);
    case 'enum':
      return objectType(g, field.enum);
    case 'map': {
      let k, v: string;

      switch (field.mapKey) {
        case ScalarType.FIXED32:
        case ScalarType.INT32:
        case ScalarType.SFIXED32:
        case ScalarType.SINT32:
        case ScalarType.UINT32:
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

function scalarType(type: ScalarType) {
  switch (type) {
    case ScalarType.STRING:
      return 'string';
    case ScalarType.BOOL:
      return 'boolean';
    default:
      return 'number';
  }
}

function objectType(g: GeneratedFile, field: DescMessage | DescEnum) {
  return g.import(field).toTypeOnly().name;
}

runNodeJs(createEcmaScriptPlugin({ name, version, generateTs }));
