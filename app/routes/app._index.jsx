import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Form, FormLayout, TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};

/**
 * @typedef {object} FulfillmentResult
 * @property {boolean} success
 * @property {string|null} errorMessage
 */


export const action = async ({ request }) => {
  /**
   * @param {[string]} errorMessage 
   */
  const mkResponse = (errorMessage) => json({
    result: {
      success: !errorMessage,
      errorMessage: errorMessage || null
    }
  });

  const { admin } = await authenticate.admin(request);

  const form = await request.formData();
  const orderId = form.get('orderId');
  if (!orderId) {
    return mkResponse('注文番号が指定されていません');
  }

  const orderResponse = await admin.graphql(
    `#graphql
      query getOrderByID($id: ID!) {
        order(id: $id) {
          id
          name
          fulfillmentOrders(first: 10) {
            edges {
              node {
                id
                status
                requestStatus
                supportedActions {
                  action
                }
                destination {
                  address1
                  address2
                  city
                  countryCode
                  email
                  firstName
                  lastName
                  phone
                  province
                  zip
                }
                lineItems(first: 1) {
                  edges {
                    node {
                      id
                      totalQuantity
                      remainingQuantity
                      inventoryItemId
                    }
                  }
                }
                assignedLocation {
                  name
                  location {
                    address {
                      address1
                      address2
                      city
                      countryCode
                      phone
                      province
                      zip
                    }
                    id
                  }
                }
                merchantRequests(first: 1){
                  edges {
                    node {
                      message
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      {
        variables: {
          id: `gid://shopify/Order/${orderId}`
        },
      });
  const orderResponseObj = await orderResponse.json();
  const edges = orderResponseObj?.data?.order?.fulfillmentOrders?.edges;
  if (!edges || !edges[0]) {
    return mkResponse('注文情報の取得に失敗しました');
  }

  const fulfillmentOrderId = edges[0].node.id;

  const lineItemEdges = edges[0].node.lineItems.edges;
  if (!lineItemEdges || !lineItemEdges[0]) {
    return mkResponse('Response schema invalid.');
  }

  /** @type {OrderLineItem[]} */
  const lineItems = lineItemEdges.map(li => ({
    id: li.node.id,
    quantity: li.node.totalQuantity
  }));

  const lineItemsByFulfillmentOrderQuery = lineItems.map(li => `
            {
              fulfillmentOrderId: $fulfillmentOrderId,
              fulfillmentOrderLineItems: [
                {
                  id: "${li.id}",
                  quantity: ${li.quantity}
                }
              ]
            }
  `).join(',')
  const createFulfillmentResponse = await admin.graphql(
    `#graphql
      mutation fulfillmentCreateV2($fulfillmentOrderId: ID!) {
        fulfillmentCreateV2(fulfillment: {
          notifyCustomer: false,
          trackingInfo: {
            company: "my-shipping-company",
            number: "1562678",
            url: "https://www.my-shipping-company.com"
          },
          lineItemsByFulfillmentOrder: [${lineItemsByFulfillmentOrderQuery}]
        })
        {
          fulfillment {
            id
            status
            trackingInfo {
              company
              number
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          fulfillmentOrderId
        },
      });

  const fulfillmentResponseObj = await createFulfillmentResponse.json();

  /** @type {FulfillmentResult} */
  const userErrors = fulfillmentResponseObj?.data?.fulfillmentCreateV2?.userErrors;
  if (!(userErrors instanceof Array)) {
    return mkResponse('Response schema invalid.');
  }
  if (userErrors.length > 0) {
    return mkResponse(`フルフィルメント操作に失敗しました(${userErrors.map(e => e.message).join(',')})`);
  }

  return mkResponse();
};

export default function Index() {
  const nav = useNavigation();
  const actionData = useActionData();
  /** @type {FulfillmentResult} */
  const result = actionData?.result;
  const submit = useSubmit();
  const isLoading =
    ["loading", "submitting"].includes(nav.state) && nav.formMethod === "POST";
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    if (result) {
      shopify.toast.show(result.success ? `出荷完了!` : result.errorMessage, {
        isError: !result.success
      });
    }
  }, [result]);
  const handleSubmit = () => submit({
    orderId
  }, { replace: true, method: "POST" });

  return (
    <Page>
      <ui-title-bar title="研修6「Fulfillment」">
        <button variant="primary" onClick={handleSubmit}>
          出荷する
        </button>
      </ui-title-bar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <Form>
                <FormLayout>
                  <TextField value={orderId} label="注文ID" name="orderId" onChange={orderId => setOrderId(orderId)} />
                </FormLayout>
              </Form>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
