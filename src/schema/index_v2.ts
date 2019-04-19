import {
  GraphQLSchema,
  GraphQLObjectType,
  visit,
  Kind,
  GraphQLInterfaceType,
} from "graphql"
import { transformSchema, Transform, Request } from "graphql-tools"
import {
  visitSchema,
  VisitSchemaKind,
  TypeVisitor,
} from "graphql-tools/dist/transforms/visitSchema"
import {
  createResolveType,
  fieldToFieldConfig,
} from "graphql-tools/dist/stitching/schemaRecreation"
import { GravityIDFields, InternalIDFields } from "./object_identification"

const KAWSTypes = ["MarketingCollection", "MarketingCollectionQuery"]
const ExchangeTypes = [
  "CommerceOrder",
  "CommercePartner",
  "CommerceUser",
  "CommerceLineItem",
  "CommerceFulfillment",
  "CommerceBuyOrder",
  "CommerceOffer",
  "CommerceOfferOrder",
]

class IdRenamer implements Transform {
  transformSchema(schema: GraphQLSchema): GraphQLSchema {
    // Keep a reference to all new interface types, as we'll need them to define
    // them on the new object types.
    const newInterfaces: { [name: string]: GraphQLInterfaceType } = {}

    const newSchema = visitSchema(schema, {
      [VisitSchemaKind.OBJECT_TYPE]: ((type: GraphQLObjectType<any, any>) => {
        const fields = type.getFields()
        const newFields = {}

        const resolveType = createResolveType((_name, type) => type)

        Object.keys(fields).forEach(fieldName => {
          const field = fields[fieldName]
          if (field.name === "id") {
            if (
              field.description === GravityIDFields.id.description ||
              type.name === "DoNotUseThisPartner"
            ) {
              newFields["gravityID"] = {
                ...fieldToFieldConfig(field, resolveType, true),
                resolve: ({ id }) => id,
                name: "gravityID",
              }
            } else if (
              field.description === InternalIDFields.id.description ||
              KAWSTypes.includes(type.name) ||
              ExchangeTypes.includes(type.name)
            ) {
              newFields["internalID"] = {
                ...fieldToFieldConfig(field, resolveType, true),
                resolve: ({ id }) => id,
                name: "internalID",
              }
            } else {
              throw new Error(`Do not add new id fields (${type.name})`)
            }
          } else {
            newFields[fieldName] = fieldToFieldConfig(field, resolveType, true)
          }
        })

        return new GraphQLObjectType({
          name: type.name,
          description: type.description,
          astNode: type.astNode,
          fields: newFields,
          interfaces: type
            .getInterfaces()
            .map(iface => newInterfaces[iface.name]),
        })
      }) as TypeVisitor,

      [VisitSchemaKind.INTERFACE_TYPE]: ((type: GraphQLInterfaceType) => {
        const fields = type.getFields()
        const newFields = {}

        const resolveType = createResolveType((_name, type) => type)

        Object.keys(fields).forEach(fieldName => {
          const field = fields[fieldName]
          if (field.name === "id") {
            if (
              field.description === GravityIDFields.id.description ||
              type.name === "DoNotUseThisPartner"
            ) {
              newFields["gravityID"] = {
                ...fieldToFieldConfig(field, resolveType, true),
                // resolve: ({ id }) => id,
                name: "gravityID",
              }
            } else if (
              field.description === InternalIDFields.id.description ||
              KAWSTypes.includes(type.name) ||
              ExchangeTypes.includes(type.name)
            ) {
              newFields["internalID"] = {
                ...fieldToFieldConfig(field, resolveType, true),
                // resolve: ({ id }) => id,
                name: "internalID",
              }
            } else {
              throw new Error(`Do not add new id fields (${type.name})`)
            }
          } else {
            newFields[fieldName] = fieldToFieldConfig(field, resolveType, true)
          }
        })

        const newInterface = new GraphQLInterfaceType({
          name: type.name,
          description: type.description,
          astNode: type.astNode,
          fields: newFields,
        })
        newInterfaces[newInterface.name] = newInterface
        return newInterface
      }) as TypeVisitor,
    })
    return newSchema
  }

  public transformRequest(originalRequest: Request): Request {
    const newDocument = visit(originalRequest.document, {
      [Kind.FIELD]: {
        enter: node => {
          if (
            node.name.value === "gravityID" ||
            node.name.value === "internalID"
          ) {
            return {
              ...node,
              name: {
                ...node.name,
                value: "id",
              },
            }
          }
        },
      },
    })

    return {
      ...originalRequest,
      document: newDocument,
    }
  }

  // TODO: If we want to make this generic for upstream usage, use `transformResult` instead of the inline resolver in transform schema
  // public transformResult(result: Result): Result {
  //   return result
  // }
}

export const transformToV2 = (schema: GraphQLSchema): GraphQLSchema => {
  return transformSchema(schema, [new IdRenamer()])
}
