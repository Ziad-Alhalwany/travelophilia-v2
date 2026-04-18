import { useState } from "react";
import apiClient from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TripRequestForm({ tripSlug, tripTitle }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      await apiClient.submitTripRequest(tripSlug, {
        traveler: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        notes: formData.notes,
      });
      setStatus("success");
    } catch (err) {
      console.error("Failed to submit request:", err);
      setStatus("error");
      setErrorMessage(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  if (status === "success") {
    return (
      <div className="p-8 text-center rounded-2xl bg-[#0a1219] border border-accent-strong/30 backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-accent-strong/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl text-accent-strong">✓</span>
        </div>
        <h3 className="text-2xl font-bold mb-2">Request Received!</h3>
        <p className="text-text-muted text-sm">
          Thank you for your interest in the <strong>{tripTitle}</strong> journey. Our travel experts will contact you shortly to finalize details.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[radial-gradient(circle_at_top_right,#15232d_0,#090f14_80%)] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1">Request This Journey</h3>
        <p className="text-sm text-text-muted">Enter your details and our experts will be in touch.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className="text-xs text-text-muted">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="e.g. John"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="bg-[#05090c] border-white/10 rounded-xl focus-visible:ring-accent-strong h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName" className="text-xs text-text-muted">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="e.g. Doe"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="bg-[#05090c] border-white/10 rounded-xl focus-visible:ring-accent-strong h-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs text-text-muted">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            required
            value={formData.email}
            onChange={handleChange}
            className="bg-[#05090c] border-white/10 rounded-xl focus-visible:ring-accent-strong h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-xs text-text-muted">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={formData.phone}
            onChange={handleChange}
            className="bg-[#05090c] border-white/10 rounded-xl focus-visible:ring-accent-strong h-11"
          />
        </div>

        <div className="space-y-1.5 mb-6">
          <Label htmlFor="notes" className="text-xs text-text-muted">Special Requests / Notes</Label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            placeholder="Any dietary requirements or special occasions?"
            value={formData.notes}
            onChange={handleChange}
            className="flex w-full bg-[#05090c] border border-white/10 rounded-xl px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[80px]"
          />
        </div>

        {status === "error" && (
          <div className="p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {errorMessage}
          </div>
        )}

        <Button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-xl bg-gradient-to-r from-[#00d8c0] to-[#1abc9c] text-[#050711] font-bold h-12 shadow-[0_10px_25px_rgba(0,216,192,0.3)] hover:-translate-y-[1px] transition-all disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {status === "loading" ? "Submitting..." : "Submit Request"}
        </Button>
        <p className="text-center text-[11px] text-text-muted mt-3">
          No payment required at this step.
        </p>
      </form>
    </div>
  );
}
