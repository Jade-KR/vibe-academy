import { Html, Head, Body, Container, Section, Text, Button, Hr } from "@react-email/components";

interface ResetPasswordEmailProps {
  resetLink: string;
  expiryHours: number;
}

export function ResetPasswordEmail({ resetLink, expiryHours }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Text style={headingStyle}>Reset your password</Text>
            <Text style={textStyle}>
              We received a request to reset your password. Click the button below to choose a new
              password. This link will expire in {expiryHours} hour{expiryHours > 1 ? "s" : ""}.
            </Text>
            <Button style={buttonStyle} href={resetLink}>
              Reset password
            </Button>
            <Text style={disclaimerStyle}>
              If you did not request a password reset, you can safely ignore this email. Your
              password will not be changed.
            </Text>
          </Section>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>vibePack</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ResetPasswordEmail;

// ---- Styles ----

const bodyStyle = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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

const disclaimerStyle = {
  fontSize: "14px",
  color: "#8898aa",
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
