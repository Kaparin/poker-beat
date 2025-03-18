"use client"

import { useEffect } from "react"
import { isTelegramWebApp } from "@/lib/telegram-utils"

export default function SecurityPolicyPage() {
  useEffect(() => {
    // Notify Telegram that the WebApp is ready
    if (isTelegramWebApp()) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }
  }, [])

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Security Policy</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Protection</h2>
        <p className="mb-4">
          At Poker Beat, we take the security and privacy of your data seriously. This policy outlines the measures we
          take to protect your information and ensure fair gameplay.
        </p>
        <p className="mb-4">
          We only collect the minimum amount of personal information necessary to provide our services. Your Telegram
          profile data is stored securely and is never shared with third parties without your consent.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Account Security</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Authentication is handled securely through Telegram's authentication mechanism.</li>
          <li>All communication between your device and our servers is encrypted using HTTPS and WSS protocols.</li>
          <li>We implement rate limiting to prevent brute force attacks.</li>
          <li>Suspicious login attempts are monitored and may trigger additional verification.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Financial Security</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>All financial transactions are securely processed and recorded.</li>
          <li>Withdrawals above certain thresholds require additional verification.</li>
          <li>We implement daily and monthly withdrawal limits to protect your funds.</li>
          <li>TON blockchain transactions are handled securely with industry-standard practices.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Fair Play</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Our card shuffling uses cryptographically secure random number generation.</li>
          <li>All game outcomes are determined by the server, not the client, to prevent manipulation.</li>
          <li>We actively monitor for collusion and other forms of cheating.</li>
          <li>Multiple accounts per player are prohibited and may result in account suspension.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Rights (GDPR Compliance)</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You have the right to access all data we hold about you.</li>
          <li>You can request a complete export of your data at any time.</li>
          <li>You have the right to request deletion of your account and associated data.</li>
          <li>Data deletion requests are processed within 30 days.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Security Measures</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Regular security audits and penetration testing.</li>
          <li>Encryption of sensitive data at rest and in transit.</li>
          <li>Secure coding practices and regular dependency updates.</li>
          <li>Comprehensive logging and monitoring for suspicious activities.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Reporting Security Issues</h2>
        <p className="mb-4">
          If you discover a security vulnerability or have concerns about the security of your account, please contact
          us immediately at{" "}
          <a href="mailto:security@pokerbeat.app" className="text-blue-600 hover:underline">
            security@pokerbeat.app
          </a>
          .
        </p>
        <p>
          We take all security reports seriously and will investigate promptly. We appreciate your help in keeping Poker
          Beat secure for everyone.
        </p>
      </section>
    </div>
  )
}

