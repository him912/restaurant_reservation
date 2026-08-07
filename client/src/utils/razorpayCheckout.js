const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise = null;

const loadRazorpayScript = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay is only available in the browser"));
  }

  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Razorpay));
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load Razorpay checkout")),
        );
        return;
      }

      const script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
      document.body.appendChild(script);
    });
  }

  return scriptPromise;
};

export const openRazorpayCheckout = async ({
  keyId,
  order,
  reservationId,
  user,
  restaurantName,
  onSuccess,
  onDismiss,
  onPaymentFailed,
  verifyPayment,
}) => {
  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "DineFlow",
      description: `Booking deposit — ${restaurantName || "Restaurant"}`,
      order_id: order.id,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: user?.phone || "",
      },
      theme: { color: "#4f46e5" },
      handler: async (response) => {
        try {
          const verified = await verifyPayment({
            reservationId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          onSuccess?.(verified);
          resolve(verified);
        } catch (error) {
          onPaymentFailed?.(error);
          reject(error);
        }
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
          resolve(null);
        },
      },
    };

    const checkout = new Razorpay(options);
    checkout.on("payment.failed", () => {
      onPaymentFailed?.();
      resolve(null);
    });
    checkout.open();
  });
};
