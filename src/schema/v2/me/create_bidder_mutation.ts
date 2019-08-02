import { GraphQLNonNull, GraphQLString } from "graphql"
import { mutationWithClientMutationId } from "graphql-relay"
import Bidder from "schema/v2/bidder"
import { ResolverContext } from "types/graphql"

export default mutationWithClientMutationId<any, any, ResolverContext>({
  name: "CreateBidder",
  description: "Create a bidder",
  inputFields: {
    saleID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  } /*
  FIXME: Generated by the snake_case to camelCase codemod.
         Either use this to fix inputs and/or remove this comment.
  {
    const {
      saleID
    } = newFields;
    const oldFields = {
      saleID: sale_id
    };
  }
  */,
  outputFields: {
    bidder: {
      type: Bidder.type,
      resolve: bidder => bidder,
    },
  },
  mutateAndGetPayload: ({ saleID: sale_id }, { createBidderLoader }) => {
    if (!createBidderLoader) {
      return new Error("You need to be signed in to perform this action")
    }

    return createBidderLoader({ sale_id })
  },
})