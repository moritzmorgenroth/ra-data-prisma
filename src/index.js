import merge from 'lodash/merge';
import buildDataProvider from 'ra-data-graphql';
import { DELETE, DELETE_MANY, UPDATE, UPDATE_MANY, GET_LIST, GET_ONE, GET_MANY, GET_MANY_REFERENCE, CREATE} from 'react-admin';
import camelCase from 'lodash/camelCase';
import pluralize from 'pluralize'

import buildQuery from './buildQuery';

(function() {
    var childProcess = require("child_process");
    var oldSpawn = childProcess.spawn;
    function mySpawn() {
        console.log('spawn called');
        console.log(arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    childProcess.spawn = mySpawn;
})();

const defaultOptions = {
    buildQuery,
    introspection: {
        operationNames: {
          [GET_LIST]: resource => {
              return `${pluralize(camelCase(resource.name))}`
          },
          [GET_ONE]: resource => `${camelCase(resource.name)}`,
          [GET_MANY]: resource => `${pluralize(camelCase(resource.name))}`,
          [GET_MANY_REFERENCE]: resource => `${pluralize(camelCase(resource.name))}`,
          [CREATE]: resource => `create${resource.name}`,
          [UPDATE]: resource => `update${resource.name}`,
          [DELETE]: resource => `delete${resource.name}`
        },
      }
};

export default options => {
    return buildDataProvider(merge({}, defaultOptions, options)).then(
        defaultDataProvider => {
            return (fetchType, resource, params) => {
                // Graphcool does not support multiple deletions so instead we send multiple DELETE requests
                // This can be optimized using the apollo-link-batch-http link
                if (fetchType === DELETE_MANY) {
                    const { ids, ...otherParams } = params;
                    return Promise.all(
                        params.ids.map(id =>
                            defaultDataProvider(DELETE, resource, {
                                id,
                                ...otherParams,
                            })
                        )
                    ).then(results => {
                        const data = results.reduce(
                            (acc, { data }) => [...acc, data.id],
                            []
                        );

                        return { data };
                    });
                }
                // Graphcool does not support multiple deletions so instead we send multiple UPDATE requests
                // This can be optimized using the apollo-link-batch-http link
                if (fetchType === UPDATE_MANY) {
                    const { ids, ...otherParams } = params;
                    return Promise.all(
                        params.ids.map(id =>
                            defaultDataProvider(UPDATE, resource, {
                                id,
                                ...otherParams,
                            })
                        )
                    ).then(results => {
                        const data = results.reduce(
                            (acc, { data }) => [...acc, data.id],
                            []
                        );

                        return { data };
                    });
                }

                return defaultDataProvider(fetchType, resource, params);
            };
        }
    );
};
