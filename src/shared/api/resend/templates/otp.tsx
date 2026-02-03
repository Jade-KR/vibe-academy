import { Html, Head, Body, Container, Section, Text, Hr } from "@react-email/components";

interface OtpEmailProps {
  name?: string;
  otp: string;
}

export function OtpEmail({ name, otp }: OtpEmailProps) {
  const greeting = name ? `${name}` : "there";

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Text style={headingStyle}>Your verification code</Text>
            <Text style={textStyle}>
              Hi {greeting}, use the following code to verify your identity. This code will expire
              in 10 minutes.
            </Text>
            <Section style={codeContainerStyle}>
              <Text style={codeStyle}>{otp}</Text>
            </Section>
            <Text style={textStyle}>
              If you did not request this code, you can safely ignore this email.
            </Text>
          </Section>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>vibePack</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OtpEmail;

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

const codeContainerStyle = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "16px 24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeStyle = {
  fontSize: "32px",
  fontWeight: "bold" as const,
  letterSpacing: "8px",
  color: "#1a1a1a",
  margin: "0",
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
