var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import { GET_LIST, GET_MANY, GET_MANY_REFERENCE, DELETE, CREATE, UPDATE, GET_ONE } from "react-admin";
import { QUERY_TYPES } from "ra-data-graphql";
import { TypeKind } from "graphql";

import { encodeQuery, encodeMutation } from "./graphqlify";
import getFinalType from "./getFinalType";
import isList from "./isList";
import isRequired from "./isRequired";

export const buildFields = introspectionResults => type => type.fields.reduce((acc, field) => {
  const type = getFinalType(field.type);

  if (type.name.startsWith("_")) {
    return acc;
  }

  if (type.kind !== TypeKind.OBJECT) {
    return _extends({}, acc, { [field.name]: { id: {} } });
  }

  const linkedResource = introspectionResults.resources.find(r => r.type.name === type.name);

  if (linkedResource) {
    return _extends({}, acc, { [field.name]: { fields: { id: {} } } });
  }

  const linkedType = introspectionResults.types.find(t => t.name === type.name);

  if (linkedType) {
    // This is a temporary workaround. Should be implemented proper knowing top level type later. 
    // FIXED: Breakout for reccuring types. 
    if (linkedType.name === type.name) return _extends({}, acc, { [field.name]: { fields: { id: {} } } });
    return _extends({}, acc, {
      [field.name]: {
        fields: buildFields(introspectionResults)(linkedType.fields),
        id: {}
      }
    });
  }

  // NOTE: We might have to handle linked types which are not resources but will have to be careful about
  // ending with endless circular dependencies
  return acc;
}, {});

export const getArgType = arg => {
  const type = getFinalType(arg.type);
  const required = isRequired(arg.type);
  const list = isList(arg.type);

  return `${list ? "[" : ""}${type.name}${list ? "!]" : ""}${required ? "!" : ""}`;
};

export const buildArgs = (query, variables, inputType) => {
  if (query.args.length === 0) {
    return {};
  }

  const validVariables = Object.keys(variables).filter(k => typeof variables[k] !== "undefined");
  let args;
  if (inputType) {
    args = inputType.inputFields.filter(a => validVariables.includes(a.name)).reduce((acc, arg) => _extends({}, acc, { [`${arg.name}`]: `$${arg.name}` }), {});
  } else {
    args = query.args.filter(a => validVariables.includes(a.name)).reduce((acc, arg) => _extends({}, acc, { [`${arg.name}`]: `$${arg.name}` }), {});
  }
  return args;
};

export const buildApolloArgs = (query, variables, inputType) => {
  if (query.args.length === 0) {
    return {};
  }

  const validVariables = Object.keys(variables).filter(k => typeof variables[k] !== "undefined");

  let args;
  if (inputType) {
    args = inputType.inputFields.filter(a => validVariables.includes(a.name)).reduce((acc, arg) => {
      return _extends({}, acc, { [`$${arg.name}`]: getArgType(arg) });
    }, {});
  } else {
    args = query.args.filter(a => validVariables.includes(a.name)).reduce((acc, arg) => {
      return _extends({}, acc, { [`$${arg.name}`]: getArgType(arg) });
    }, {});
  }

  return args;
};
export const getInputObjectForType = (introspectionResults, type, aorFetchType) => {
  const typeName = type.name;
  let argName;
  if (aorFetchType === CREATE) {
    argName = `${typeName}CreateInput`;
  }
  if (aorFetchType === UPDATE) {
    argName = `${typeName}UpdateInput`;
  }
  return introspectionResults.types.find(arg => arg.name === argName);
};

export default (introspectionResults => (resource, aorFetchType, queryType, variables) => {
  const inputType = getInputObjectForType(introspectionResults, resource.type, aorFetchType);
  const apolloArgs = buildApolloArgs(queryType, variables, inputType);
  const args = buildArgs(queryType, variables, inputType);
  const fields = buildFields(introspectionResults)(resource.type);
  console.log(fields);

  if (aorFetchType === GET_LIST || aorFetchType === GET_MANY || aorFetchType === GET_MANY_REFERENCE) {
    const result = encodeQuery(queryType.name, {
      params: apolloArgs,
      fields: {
        items: {
          field: queryType.name,
          params: args,
          fields
        },
        total: {
          field: `${queryType.name}Connection`,
          params: args,
          fields: {
            aggregate: {
              fields: { count: {} }
            }
          }
        }
      }
    });

    return result;
  }

  if (aorFetchType === DELETE) {
    return encodeMutation(queryType.name, {
      params: apolloArgs,
      fields: {
        data: {
          field: queryType.name,
          params: args,
          fields: { id: {} }
        }
      }
    });
  }
  if (aorFetchType === GET_ONE) {
    return encodeQuery(queryType.name, {
      params: apolloArgs,
      fields: {
        data: {
          field: queryType.name,
          params: args,
          fields
        }
      }
    });
  }
  const query = {
    params: apolloArgs,
    fields: {
      data: {
        field: queryType.name,
        params: { data: args },
        fields
      }
    }
  };

  const result = QUERY_TYPES.includes(aorFetchType) ? encodeQuery(queryType.name, query) : encodeMutation(queryType.name, query);

  return result;
});