import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface RefundEmailProps {
  name?: string;
  courseName: string;
  amount: number;
  currency: string;
  reason?: string;
  dashboardUrl: string;
}

export function RefundEmail({
  name,
  courseName,
  amount,
  currency,
  reason,
  dashboardUrl,
}: RefundEmailProps) {
  const greeting = name ? `${name}` : "there";
  const formattedAmount = amount.toLocaleString("en-US");

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Text style={headingStyle}>Refund processed</Text>
            <Text style={textStyle}>
              Hi {greeting}, your refund has been processed. Here are the details:
            </Text>
            <Section style={detailsStyle}>
              <Text style={detailRowStyle}>
                <strong>Course:</strong> {courseName}
              </Text>
              <Text style={detailRowStyle}>
                <strong>Refund amount:</strong> {formattedAmount} {currency}
              </Text>
              {reason ? (
                <Text style={detailRowStyle}>
                  <strong>Reason:</strong> {reason}
                </Text>
              ) : null}
            </Section>
            <Text style={textStyle}>
              The refund will be reflected in your account within 3-5 business days depending on your
              payment provider.
            </Text>
            <Button style={buttonStyle} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>vibePack</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default RefundEmail;

// ---- Styles ----

const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const sectionStyle = {
  padding: "0 48px",
};

const headingStyle = {
  fontSize: "24px",
  fontWeight: "bold" as const,
  color: "#1a1a1a",
  marginBottom: "24px",
};

const textStyle = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
};

const detailsStyle = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "16px 24px",
  margin: "24px 0",
};

const detailRowStyle = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#484848",
  margin: "4px 0",
};

const buttonStyle = {
  backgroundColor: "#000000",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  marginTop: "24px",
};

const hrStyle = {
  borderColor: "#e6ebf1",
  margin: "32px 0 24px",
};

const footerStyle = {
  fontSize: "12px",
  color: "#8898aa",
  textAlign: "center" as const,
};
