# ra-data-prisma

A react-admin data provider for Prisma. This project is currently under active development. Beta releases will be published regularily. Feedback about your applications/use cases is very welcome!

- [Installation](#installation)
- [Options](#options)

## Installation

Install with:

```sh
npm install --save graphql ra-data-prisma
```

or

```sh
yarn add graphql ra-data-prisma
```

## Options

### Customize the Apollo client

You can either supply the client options by calling `buildPrismaProvider` like this:

```js
buildPrismaProvider({ clientOptions: { uri: 'https://your-prisma-endpoint', ...otherApolloOptions } });
```

Or supply your client directly with:

```js
buildPrismaProvider({ client: myClient });
```

## Contribute

To include your local fork into a test project, add the library locally to your projects `package.json`

```json
"dependencies": {
  "ra-data-prisma": "file:../path/to/your/fork/ra-data-prisma",
  //... your other dependencies
}
```

To have your changes in the source directory reflect in the lib, remember to build! 

```sh
yarn build
```

Remember to always make persistent changes in the `./src/` directory and rebuild. Your dirty work can be done directly in the `./lib/` folder, but will be overriden the next time you build. 

For testing, run 

```sh
jest
```

The test suite is currently rather thin. If you would like to contribute tests for nested types that would be great :)

Glad about feedback & contributions!
