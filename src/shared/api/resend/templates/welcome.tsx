import { Html, Head, Body, Container, Section, Text, Button, Hr } from "@react-email/components";

interface WelcomeEmailProps {
  name?: string;
  loginUrl: string;
}

export function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  const greeting = name ? `${name}` : "there";

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Text style={headingStyle}>Welcome to vibePack!</Text>
            <Text style={textStyle}>
              Hi {greeting}, thanks for signing up. We are excited to have you on board.
            </Text>
            <Text style={textStyle}>
              Get started by logging in to your account and exploring everything vibePack has to
              offer.
            </Text>
            <Button style={buttonStyle} href={loginUrl}>
              Log in to your account
            </Button>
          </Section>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>vibePack</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

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

const hrStyle = {
  borderColor: "#e6ebf1",
  margin: "32px 0 24px",
};

const footerStyle = {
  fontSize: "12px",
  color: "#8898aa",
  textAlign: "center" as const,
};
