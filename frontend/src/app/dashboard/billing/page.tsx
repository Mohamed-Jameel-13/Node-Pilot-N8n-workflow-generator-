"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

export default function BillingPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [isYearly, setIsYearly] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(data => {
        if (data.country_code === "IN") {
          setCurrency("INR");
        }
      })
      .catch(err => console.error("Error fetching location", err));

    // Dynamically load the Razorpay checkout script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("http://localhost:3001/api/billing/subscription-status", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.active) {
        setSubscription(data);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("Error fetching subscription", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // 1. Request a new subscription from our backend
      const planType = isYearly ? "yearly" : "monthly";
      const finalAmount = currency === "INR" 
        ? (isYearly ? 299000 : 29900) 
        : (isYearly ? 3000 : 300);

      const subRes = await fetch("http://localhost:3001/api/billing/create-subscription", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          plan: planType,
          currency,
          amount: finalAmount
        })
      });
      const subscriptionRes = await subRes.json();
      
      if (!subscriptionRes.id) {
        throw new Error(subscriptionRes.error || "Failed to create subscription");
      }

      // 2. Open Razorpay Checkout modal for subscription
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Your Razorpay key ID
        subscription_id: subscriptionRes.id,
        name: "NodePilot",
        description: `${isYearly ? 'Yearly' : 'Monthly'} Pro Plan Subscription`,
        handler: async function (response: any) {
          // 3. Verify payment signature on our backend
          const verifyRes = await fetch("http://localhost:3001/api/billing/verify-subscription", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: planType
            })
          });
          const result = await verifyRes.json();
          if (result.success) {
            setMessage("Payment successful! Your subscription is now active.");
            fetchSubscription();
          } else {
            setMessage("Payment verification failed.");
          }
        },
        prefill: {
          name: session.user.user_metadata?.full_name || "User",
          email: session.user.email,
        },
        theme: {
          color: "#000000"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setMessage(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (err: any) {
      setMessage(`Checkout setup failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    setMessage("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("http://localhost:3001/api/billing/cancel-subscription", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Subscription cancelled successfully.");
        fetchSubscription();
      } else {
        setMessage(`Failed to cancel: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Error cancelling: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const monthlyPrice = currency === "INR" ? "₹299" : "$3";
  const yearlyPrice = currency === "INR" ? "₹2990" : "$30";

  if (isLoading) {
    return <div className="flex-1 p-8 flex items-center justify-center text-muted-foreground">Loading billing information...</div>;
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-background text-foreground">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        
        {subscription ? (
          <Card className="bg-card border-border/50 text-card-foreground shadow-sm max-w-md">
            <CardHeader>
              <CardTitle>Active Subscription</CardTitle>
              <CardDescription className="text-green-500 font-medium">
                Your Pro plan is currently active.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-muted-foreground">Current Plan:</div>
                <div className="font-medium capitalize">{subscription.plan}</div>
                
                <div className="text-muted-foreground">Status:</div>
                <div className="font-medium capitalize">{subscription.status}</div>
                
                {subscription.current_end && (
                  <>
                    <div className="text-muted-foreground">Next Billing Date:</div>
                    <div className="font-medium">{new Date(subscription.current_end).toLocaleDateString()}</div>
                  </>
                )}
                
                {subscription.cancel_at_period_end && (
                  <div className="col-span-2 mt-2 p-3 bg-yellow-500/10 text-yellow-600 rounded-md">
                    Your subscription has been cancelled and will end on {new Date(subscription.current_end).toLocaleDateString()}.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4 border-t border-border/50 pt-4">
              {!subscription.cancel_at_period_end && (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => setIsCancelModalOpen(true)}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Processing..." : "Cancel Subscription"}
                  </Button>
                  
                  <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                    <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Subscription</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel your subscription? You will lose access at the end of your current billing cycle.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>Keep Subscription</Button>
                      <Button variant="destructive" onClick={() => { setIsCancelModalOpen(false); handleCancel(); }}>Confirm Cancel</Button>
                    </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {message && (
                <p className={`text-sm ${message.includes("failed") || message.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                  {message}
                </p>
              )}
            </CardFooter>
          </Card>
        ) : (
          <>
            <div className="flex items-center space-x-4 mb-8">
              <Label htmlFor="billing-cycle" className={`text-sm ${!isYearly ? 'font-bold' : 'text-muted-foreground'}`}>Monthly</Label>
              <Switch 
                id="billing-cycle" 
                checked={isYearly} 
                onCheckedChange={setIsYearly} 
              />
              <Label htmlFor="billing-cycle" className={`text-sm ${isYearly ? 'font-bold' : 'text-muted-foreground'}`}>
                Yearly <span className="text-green-500 text-xs ml-1">(Save 16%)</span>
              </Label>
            </div>
            
            <Card className="bg-card border-border/50 text-card-foreground shadow-sm max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Pro Plan
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">1-Day Free Trial</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Get full access to all AI orchestration features and unlimited workflow deployments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{isYearly ? yearlyPrice : monthlyPrice}</span>
                  <span className="text-muted-foreground">/{isYearly ? "year" : "month"}</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Unlimited AI chat interactions</li>
                  <li>✓ Unlimited deployments to self-hosted n8n</li>
                  <li>✓ BYOK (Bring Your Own Key) Support</li>
                  <li>✓ Audit Trails & Versioning</li>
                </ul>
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-muted-foreground leading-relaxed">
                  🎉 <strong className="text-foreground">1-Day Free Trial:</strong> Enter your card today — you won't be charged for 24 hours. Cancel anytime before to pay nothing.
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4">
                <Button 
                  onClick={handleSubscribe} 
                  disabled={isProcessing}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isProcessing ? "Processing..." : `Start 1-Day Free Trial — ${isYearly ? yearlyPrice + '/yr' : monthlyPrice + '/mo'} after`}
                </Button>
                <p className="text-xs text-muted-foreground text-center w-full">
                  No charge today. First payment in 24 hours. Cancel anytime.
                </p>
                {message && (
                  <p className={`text-sm ${message.includes("failed") || message.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                    {message}
                  </p>
                )}
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
