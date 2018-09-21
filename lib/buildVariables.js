var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import { GET_LIST, GET_ONE, GET_MANY, GET_MANY_REFERENCE, CREATE, UPDATE, DELETE } from "react-admin";

const buildGetListVariables = introspectionResults => (resource, aorFetchType, params) => {
  const filter = Object.keys(params.filter).reduce((acc, key) => {
    if (key === "ids") {
      return _extends({}, acc, { id_in: params.filter[key] });
    }

    if (typeof params.filter[key] === "object") {
      const type = introspectionResults.types.find(t => t.name === `${resource.type.name}WhereInput`);
      const filterSome = type.inputFields.find(t => t.name === `${key}_some`);

      if (filterSome) {
        const filter = Object.keys(params.filter[key]).reduce((acc, k) => _extends({}, acc, {
          [`${k}_in`]: params.filter[key][k]
        }), {});
        return _extends({}, acc, { [`${key}_some`]: filter });
      }
    }

    const parts = key.split(".");

    if (parts.length > 1) {
      if (parts[1] == "id") {
        const type = introspectionResults.types.find(t => t.name === `${resource.type.name}WhereInput`);
        const filterSome = type.inputFields.find(t => t.name === `${parts[0]}_some`);

        if (filterSome) {
          return _extends({}, acc, {
            [`${parts[0]}_some`]: { id: params.filter[key] }
          });
        }

        return _extends({}, acc, { [parts[0]]: { id: params.filter[key] } });
      }

      const resourceField = resource.type.fields.find(f => f.name === parts[0]);
      if (resourceField.type.name === "Int") {
        return _extends({}, acc, { [key]: parseInt(params.filter[key]) });
      }
      if (resourceField.type.name === "Float") {
        return _extends({}, acc, { [key]: parseFloat(params.filter[key]) });
      }
    }

    return _extends({}, acc, { [key]: params.filter[key] });
  }, {});

  return {
    skip: parseInt((params.pagination.page - 1) * params.pagination.perPage),
    first: parseInt(params.pagination.perPage),
    orderBy: `${params.sort.field}_${params.sort.order}`,
    where: filter
  };
};

const buildCreateUpdateVariables = () => (resource, aorFetchType, params, queryType) => Object.keys(params.data).reduce((acc, key) => {
  if (Array.isArray(params.data[key])) {
    const arg = queryType.args.find(a => a.name === `${key}Ids`);

    if (arg) {
      return _extends({}, acc, {
        [`${key}Ids`]: params.data[key].map(({ id }) => id)
      });
    }
  }

  if (typeof params.data[key] === "object") {
    const arg = queryType.args.find(a => a.name === key);
    // if (arg) {
    //     return {
    //         ...acc,
    //         [`${key}Id`]: params.data[key].id,
    //     };
    // }
    if (!arg) return acc;

    if (params.data[key] && params.data[key].id) {
      // CASE connect
      return _extends({}, acc, {
        [key]: { connect: { id: params.data[key].id } }
      });
    } else {
      // Assume CASE create
      // USE CREATE LOGIC!
      acc = {};
      params.data[key].map(item => {
        console.log(key, item);
      });
      // return {
      //   ...acc,
      //   [key]: { create: params.data[key].map(({ id }) => id)}
      // };
    }
  }

  // Never return nested types as variables for now 
  const parts = key.split(".");
  if (parts.length > 1) {
    params.data[key].map(item => {
      console.log(key, item);
    });
    return acc;
  }

  return _extends({}, acc, {
    [key]: params.data[key]
  });
}, {});

export default (introspectionResults => (resource, aorFetchType, params, queryType) => {
  switch (aorFetchType) {
    case GET_LIST:
      {
        return buildGetListVariables(introspectionResults)(resource, aorFetchType, params, queryType);
      }
    case GET_MANY:
      return {
        where: { id_in: params.ids }
      };
    case GET_MANY_REFERENCE:
      {
        const parts = params.target.split(".");

        return {
          where: { [parts[0]]: { id: params.id } }
        };
      }
    case GET_ONE:
      return {
        where: {
          id: params.id
        }
      };
    case UPDATE:
      {
        return _extends({}, buildCreateUpdateVariables(introspectionResults)(resource, aorFetchType, params, queryType), {
          id: params.id
        });
      }

    case CREATE:
      {
        return buildCreateUpdateVariables(introspectionResults)(resource, aorFetchType, params, queryType);
      }

    case DELETE:
      return {
        where: {
          id: params.id
        }
      };
  }
});