import { buildSchema } from 'graphql';

export const schema = buildSchema(`
  type ClothingItem {
    id: ID!
    name: String!
    category: String!
    price: Float!
    colorHex: String!
    colorName: String!
    colorGroup: String!
    styleTags: [String!]!
    rating: Float!
    description: String!
    material: String!
    sizes: [String!]!
    inStock: Boolean!
    imageUrl: String!
    featured: Boolean!
    stock: Int!
  }

  type PaginatedItems {
    data: [ClothingItem!]!
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
  }

  type TopRatedItem {
    id: ID!
    name: String!
    rating: Float!
  }

  type Stats {
    totalItems: Int!
    totalValue: Float!
    avgPrice: Float!
    avgRating: Float!
    inStockCount: Int!
    outOfStockCount: Int!
    featuredCount: Int!
    topRated: [TopRatedItem!]!
  }

  input CreateItemInput {
    name: String!
    category: String!
    price: Float!
    colorHex: String!
    colorName: String!
    colorGroup: String!
    styleTags: [String!]!
    rating: Float!
    description: String!
    material: String!
    sizes: [String!]!
    inStock: Boolean!
    imageUrl: String!
    featured: Boolean!
    stock: Int!
  }

  input UpdateItemInput {
    name: String
    category: String
    price: Float
    colorHex: String
    colorName: String
    colorGroup: String
    styleTags: [String!]
    rating: Float
    description: String
    material: String
    sizes: [String!]
    inStock: Boolean
    imageUrl: String
    featured: Boolean
    stock: Int
  }

  type Query {
    items(page: Int, limit: Int, category: String, colorGroup: String): PaginatedItems!
    item(id: ID!): ClothingItem
    stats: Stats!
  }

  type Mutation {
    createItem(input: CreateItemInput!): ClothingItem!
    updateItem(id: ID!, input: UpdateItemInput!): ClothingItem
    deleteItem(id: ID!): Boolean!
  }
`);
