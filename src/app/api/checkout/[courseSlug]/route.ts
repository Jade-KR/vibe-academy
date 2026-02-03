import { NextRequest } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema/users";
import { courses } from "@/db/schema/courses";
import { enrollments } from "@/db/schema/enrollments";
import { eq, and } from "drizzle-orm";
import { courseCheckoutSchema } from "@/shared/lib/validations";
import { successResponse, errorResponse, zodErrorResponse } from "@/shared/lib/api";
import { getAuthenticatedUser } from "@/shared/lib/api/auth";
import { polar } from "@/shared/api/polar/client";
import { sendEmail } from "@/shared/api/resend";
import { CourseEnrollmentEmail } from "@/shared/api/resend/templates/course-enrollment";
import { siteConfig } from "@/shared/config/site";

type RouteContext = {
  params: Promise<{ courseSlug: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { courseSlug } = await context.params;

    // 1. Validate body
    const body: unknown = await request.json();
    const parsed = courseCheckoutSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // 2. Auth + resolve DB user (need email for Polar)
    const { user } = await getAuthenticatedUser();
    if (!user) return errorResponse("UNAUTHORIZED", "Authentication required", 401);

    const [dbUser] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.supabaseUserId, user.id));
    if (!dbUser) return errorResponse("NOT_FOUND", "User not found", 404);

    // 3. Find course
    const [course] = await db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        price: courses.price,
        isFree: courses.isFree,
        isPublished: courses.isPublished,
        polarProductId: courses.polarProductId,
      })
      .from(courses)
      .where(eq(courses.slug, courseSlug))
      .limit(1);
    if (!course) return errorResponse("NOT_FOUND", "Course not found", 404);
    if (!course.isPublished) return errorResponse("BAD_REQUEST", "Course is not available", 400);

    // 4. Check already enrolled
    const [existingEnrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, dbUser.id), eq(enrollments.courseId, course.id)))
      .limit(1);
    if (existingEnrollment)
      return errorResponse("CONFLICT", "Already enrolled in this course", 409);

    // 5. Free course: create enrollment directly
    if (course.isFree) {
      const [enrollment] = await db
        .insert(enrollments)
        .values({ userId: dbUser.id, courseId: course.id })
        .returning({ id: enrollments.id });

      // Send enrollment email (fire-and-forget)
      sendEmail({
        to: dbUser.email,
        subject: `Course Enrolled - ${siteConfig.name}`,
        react: CourseEnrollmentEmail({
          name: dbUser.name ?? undefined,
          courseName: course.title,
          price: 0,
          currency: "KRW",
          learnUrl: `${siteConfig.url}/ko/learn/${courseSlug}`,
        }),
      }).catch((err) => {
        console.error("[POST /api/checkout/[courseSlug]] Failed to send enrollment email", err);
      });

      return successResponse(
        { enrolled: true, enrollmentId: enrollment.id },
        "Enrolled in free course",
        201,
      );
    }

    // 6. Paid course: create Polar checkout session
    if (!course.polarProductId) {
      return errorResponse("BAD_REQUEST", "This course is not configured for purchase yet", 400);
    }

    const checkout = await polar.checkouts.create({
      products: [course.polarProductId],
      successUrl:
        parsed.data.successUrl ??
        `${process.env.NEXT_PUBLIC_APP_URL}/ko/learn/${courseSlug}?checkout=success`,
      customerEmail: dbUser.email,
      metadata: {
        userId: dbUser.id,
        courseId: course.id,
        courseSlug: courseSlug,
        type: "course_purchase",
      },
    });

    return successResponse({ checkoutUrl: checkout.url });
  } catch (error) {
    console.error("[POST /api/checkout/[courseSlug]]", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
