import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/stripe";

function planForStatus(status: string): "PAID" | "FREE" {
  return status === "active" || status === "trialing" ? "PAID" : "FREE";
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Signature manquante", { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(payload, signature);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (customerId && subscriptionId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { stripeSubscriptionId: subscriptionId, plan: "PAID", subscriptionStatus: "active" },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          plan: planForStatus(subscription.status),
        },
      });
      break;
    }
    default:
      break;
  }

  return Response.json({ received: true });
}
