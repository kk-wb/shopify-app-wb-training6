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

export const action = async ({ request }) => {
  const form = await request.formData();
  const multiPassSecret = form.get('multiPassSecret');
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
