/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("Credit card mutation", () => {
  const creditCard = {
    id: "foo-foo",
    _id: "123",
    name: "Foo User",
    last_digits: "1234",
    expiration_month: 3,
    expiration_year: 2018,
  }

  const oldQuery = `
  mutation {
    createCreditCard(input: {token: "123abc"}) {
      credit_card {
        name
        last_digits
        expiration_month
        expiration_year
      }
    }
  }
  `

  const newQuery = `
  mutation {
    createCreditCard(input: {token: "tok_foo"}) {
      creditCardOrError {
        ... on CreditCardMutationSuccess {
          credit_card {
            id
          }
        }
        ... on CreditCardMutationFailure {
          mutationError {
            type
            message
            detail
            statusCode
          }
        }
      }
    }
  }
  `

  const rootValue = {
    createCreditCardLoader: () => Promise.resolve(creditCard),
  }

  it("creates a credit card with the old-style query", async () => {
    const data = await runAuthenticatedQuery(oldQuery, rootValue)
    expect(data).toEqual({
      createCreditCard: {
        credit_card: {
          name: "Foo User",
          last_digits: "1234",
          expiration_month: 3,
          expiration_year: 2018,
        },
      },
    })
  })

  it("creates a credit card with an error message", async () => {
    const errorRootValue = {
      createCreditCardLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/me/credit_cards?provider=stripe&token=tok_chargeDeclinedExpiredCard - {"type":"payment_error","message":"Payment information could not be processed.","detail":"Your card has expired."}`
          )
        ),
    }
    const data = await runAuthenticatedQuery(newQuery, errorRootValue)
    expect(data).toEqual({
      createCreditCard: {
        creditCardOrError: {
          mutationError: {
            detail: "Your card has expired.",
            message: "Payment information could not be processed.",
            statusCode: null,
            type: "payment_error",
          },
        },
      },
    })
  })

  it("creates a credit card successfully with the new-style query", async () => {
    const data = await runAuthenticatedQuery(newQuery, rootValue)
    expect(data).toEqual({
      createCreditCard: {
        creditCardOrError: { credit_card: { id: "foo-foo" } },
      },
    })
  })
})
