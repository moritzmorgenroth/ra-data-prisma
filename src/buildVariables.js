import {
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  DELETE
} from "react-admin";

const buildGetListVariables = introspectionResults => (
  resource,
  aorFetchType,
  params
) => {
  const filter = Object.keys(params.filter).reduce((acc, key) => {
    if (key === "ids") {
      return { ...acc, id_in: params.filter[key] };
    }

    if (typeof params.filter[key] === "object") {
      const type = introspectionResults.types.find(
        t => t.name === `${resource.type.name}WhereInput`
      );
      const filterSome = type.inputFields.find(t => t.name === `${key}_some`);

      if (filterSome) {
        const filter = Object.keys(params.filter[key]).reduce(
          (acc, k) => ({
            ...acc,
            [`${k}_in`]: params.filter[key][k]
          }),
          {}
        );
        return { ...acc, [`${key}_some`]: filter };
      }
    }

    const parts = key.split(".");

    if (parts.length > 1) {
      if (parts[1] == "id") {
        const type = introspectionResults.types.find(
          t => t.name === `${resource.type.name}WhereInput`
        );
        const filterSome = type.inputFields.find(
          t => t.name === `${parts[0]}_some`
        );

        if (filterSome) {
          return {
            ...acc,
            [`${parts[0]}_some`]: { id: params.filter[key] }
          };
        }

        return { ...acc, [parts[0]]: { id: params.filter[key] } };
      }

      const resourceField = resource.type.fields.find(f => f.name === parts[0]);
      if (resourceField.type.name === "Int") {
        return { ...acc, [key]: parseInt(params.filter[key]) };
      }
      if (resourceField.type.name === "Float") {
        return { ...acc, [key]: parseFloat(params.filter[key]) };
      }
    }

    return { ...acc, [key]: params.filter[key] };
  }, {});

  return {
    skip: parseInt((params.pagination.page - 1) * params.pagination.perPage),
    first: parseInt(params.pagination.perPage),
    orderBy: `${params.sort.field}_${params.sort.order}`,
    where: filter
  };
};

const buildCreateUpdateVariables = () => (
  resource,
  aorFetchType,
  params,
  queryType
) =>
  Object.keys(params.data).reduce((acc, key) => {
    if (Array.isArray(params.data[key])) {
      const arg = queryType.args.find(a => a.name === `${key}Ids`);

      if (arg) {
        return {
          ...acc,
          [`${key}Ids`]: params.data[key].map(({ id }) => id)
        };
      }
    }

    if (typeof params.data[key] === "object") {
      const arg = queryType.args.find(a => a.name === key);

      // FIXME: any types are accepted here!
      //if(!arg) return acc;

      console.log("Querytype args", queryType.args, params.data[key], key, resource)
      const objectKeys = Object.keys( params.previousData[key] );
      if (params.data[key] && params.data[key].id && objectKeys.length === 1 ) {
          // CASE connect
        return {
          ...acc,
          [key]: { connect: { id: params.data[key].id } }
        };
      }
      else if ( params.data[key] && params.data[key].id && objectKeys.length > 1 ) {
        // CASE update
        // * This only takes care of 1 level down of nesting
        // * Anything deeper it will just carry over

        // Check if there is a difference. If there is no difference then we shouldn't include it
        // If the object has another object or array of items don't include it
        const updateObjectVariables = {};
        for ( const [itemKey, itemValue] of Object.entries( params.data[key] ) ) {
          if (Array.isArray(itemValue) || typeof itemValue === "object" ) { continue; }
          if ( !itemKey.startsWith('__') && itemValue !== params.previousData[key][itemKey] ) {
            updateObjectVariables[itemKey] = itemValue;
          }
        }

        // Do not include data
        if ( Object.keys( updateObjectVariables ).length == 0 ) {
          return { ...acc };
        }

        return {
          ...acc,
          [key]: { update: updateObjectVariables },
        }
      }
      else{
          return {
            ...acc,
            [key]: { create: params.data[key] }
          };

        }
    }

    // Never return nested types as variables for now
    const parts = key.split(".");
    if (parts.length > 1) {
      if ( Array.isArray( params.data[key] ) ) {
        params.data[key].map(item => {
          console.log(key, item)
        });
      }
      return acc;
    }

    return {
      ...acc,
      [key]: params.data[key]
    };
  }, {});

export default introspectionResults => (
  resource,
  aorFetchType,
  params,
  queryType
) => {
  switch (aorFetchType) {
    case GET_LIST: {
      return buildGetListVariables(introspectionResults)(
        resource,
        aorFetchType,
        params,
        queryType
      );
    }
    case GET_MANY:
      return {
        where: { id_in: params.ids }
      };
    case GET_MANY_REFERENCE: {
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
    case UPDATE: {
      return {
        ...buildCreateUpdateVariables(introspectionResults)(
          resource,
          aorFetchType,
          params,
          queryType
        ),
        id: params.id
      };
    }

    case CREATE: {
      return buildCreateUpdateVariables(introspectionResults)(
        resource,
        aorFetchType,
        params,
        queryType
      );
    }

    case DELETE:
      return {
        where: {
          id: params.id
        }
      };
  }
};
