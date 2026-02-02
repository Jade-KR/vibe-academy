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

interface CourseEnrollmentEmailProps {
  name?: string;
  courseName: string;
  price: number;
  currency: string;
  learnUrl: string;
}

export function CourseEnrollmentEmail({
  name,
  courseName,
  price,
  currency,
  learnUrl,
}: CourseEnrollmentEmailProps) {
  const greeting = name ? `${name}` : "there";
  const formattedPrice = price.toLocaleString("en-US");
  const isFree = price === 0;

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Text style={headingStyle}>
              {isFree ? "Course enrolled!" : "Payment confirmed!"}
            </Text>
            <Text style={textStyle}>
              Hi {greeting}, you have been successfully enrolled in the following course:
            </Text>
            <Section style={detailsStyle}>
              <Text style={detailRowStyle}>
                <strong>Course:</strong> {courseName}
              </Text>
              <Text style={detailRowStyle}>
                <strong>Amount:</strong>{" "}
                {isFree ? "Free" : `${formattedPrice} ${currency}`}
              </Text>
            </Section>
            <Text style={textStyle}>
              You now have lifetime access to this course. Start learning right away!
            </Text>
            <Button style={buttonStyle} href={learnUrl}>
              Start Learning
            </Button>
          </Section>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>vibePack</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CourseEnrollmentEmail;

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
