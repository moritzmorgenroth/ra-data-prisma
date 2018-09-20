# ra-data-prisma

A react-admin data provider for Prisma. This project is currently under active development. Beta releases will be published regularily. Feedback about your applications/use cases is very welcome!

- [Installation](#installation)
- [Usage](#usage)
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

## Usage

Create your `react-admin` app and bootstrap the data provider like so: 

```
import { PostList, PostEdit, PostCreate } from './post';
import buildPrismaProvider from 'ra-data-prisma';

class App extends Component {
    constructor() {
        super();
        this.state = { dataProvider: null };
    }
    componentDidMount() {
        buildPrismaProvider({ client })
            .then(dataProvider => this.setState({ dataProvider }));
    }

    render() {
        const { dataProvider } = this.state;

        if (!dataProvider) {
            return <div>Loading</div>;
        }

        return (
            <Admin dataProvider={dataProvider}>
                <Resource name="Post" list={PostList} edit={PostEdit} create={PostCreate} />
            </Admin>
        );
    }
}
```

This assumes your have a resource of the type `Post`, which will be automatically recognized if you provided the CRUD logic for the type in the usual prisma conventions, i.e. you schema should look something like: 

```graphql
type Query {
  
  posts(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): [Post]!
  post(where: PostWhereUniqueInput!): Post
  postsConnection(where: PostWhereInput, orderBy: PostOrderByInput, skip: Int, after: String, before: String, first: Int, last: Int): PostConnection!

}

type Mutation {
  createPost(data: PostCreateInput!): Post!
  updatePost(data: PostUpdateInput!, where: PostWhereUniqueInput!): Post
  deletePost(where: PostWhereUniqueInput!): Post
}

type Post {
  id: ID!
  text: String!
}

```

This means you can either hook up your data provider directly to your prisma database or import the types from prisma generated code in your schema and override/customize the resolvers or simply forward them to your database unsing resolver-forwarding. Let the Prisma magic happen :) 

I will publish one of our projects using this library as a complete/working sample project. 

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

```
"dependencies": {
  "ra-data-prisma": "file:../path/to/your/fork/ra-data-prisma",
  ... your other dependencies
}
```
and run `npm i`. For me, hot reloading works with my `react-admin` test app. 

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

## More

There is another work in progress ongoing: https://github.com/Weakky/ra-data-prisma

Thanks for the feedback @Weakky! 
