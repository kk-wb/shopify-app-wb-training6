import { useState, useEffect } from "react";
import { useSubmit } from "@remix-run/react";
import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  Form, FormLayout, TextField,
} from "@shopify/polaris";

// TODO:
// const Multipassify = require('multipassify');

export const action = async ({ request }) => {
  const form = await request.formData();
  const multiPassSecret = form.get('multiPassSecret');

  // TODO: 
  // Construct the Multipassify encoder
  // var multipassify = new Multipassify("SHOPIFY MULTIPASS SECRET");

  // Create your customer data hash
  // var customerData = { email: 'test@example.com', remote_ip:'USERS IP ADDRESS', return_to:"http://some.url"};

  // Encode a Multipass token
  // var token = multipassify.encode(customerData);
  
  // Generate a Shopify multipass URL to your shop
  // var url = multipassify.generateUrl(customerData, "yourstorename.myshopify.com");

  // Generates a URL like:  https://yourstorename.myshopify.com/account/login/multipass/<MULTIPASS-TOKEN>

  // TODO: ここでリダイレクト？
}

export default function MultiPassPage() {
  const submit = useSubmit();
  const [multiPassSecret, setMultipassSecret] = useState(null);

  const handleLogin = () => submit({
    multiPassSecret
  }, { replace: true, method: "POST" });

  return (
    <Page>
      <ui-title-bar title="研修6「Multipass」">
        <button variant="primary" onClick={handleLogin}>
          SSOログイン
        </button>
      </ui-title-bar>
      <Layout>
        <Layout.Section>
          <Card>
            <Form>
              <FormLayout>
                <TextField value={multiPassSecret} label="Multipass secret" onChange={pass => setMultipassSecret(pass)} />
              </FormLayout>
            </Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
