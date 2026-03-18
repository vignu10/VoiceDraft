import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - VoiceDraft',
  description: 'Privacy Policy for VoiceDraft app',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
            Privacy Policy
          </h1>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              VoiceDraft (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              1. Information We Collect
            </h2>

            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
              1.1 Audio Recordings
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              VoiceDraft allows you to record audio content to create blog posts. Your audio recordings are:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 dark:text-neutral-300 space-y-2">
              <li>Processed using AI services (OpenAI) to generate text content</li>
              <li>Stored securely on our servers</li>
              <li>Used solely for the purpose of creating your blog content</li>
              <li>Never shared with third parties for marketing purposes</li>
            </ul>

            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
              1.2 Camera Access
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              VoiceDraft may request access to your device&apos;s camera solely for the purpose of capturing profile photos or images to accompany your blog posts. We do not access your camera for any other purpose, and images are not stored or shared beyond what is necessary for the app&apos;s functionality.
            </p>

            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
              1.3 Account Information
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 dark:text-neutral-300 space-y-2">
              <li>Email address (for account management and authentication)</li>
              <li>Profile information (name, bio, profile photo if provided)</li>
              <li>Blog posts and drafts you create</li>
            </ul>

            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
              1.4 Device Information
            </h3>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We automatically collect certain device information, including:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 dark:text-neutral-300 space-y-2">
              <li>Device type and operating system</li>
              <li>Unique device identifiers</li>
              <li>Mobile network information</li>
              <li>App version and usage statistics</li>
            </ul>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              2. How We Use Your Information
            </h2>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 dark:text-neutral-300 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your audio recordings and generate blog content</li>
              <li>Authenticate users and manage accounts</li>
              <li>Communicate with you about our services</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              3. Data Sharing and Disclosure
            </h2>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 dark:text-neutral-300 space-y-2">
              <li><strong>Service Providers:</strong> We use OpenAI to process your audio recordings and generate text content. Your data is shared only as necessary for this purpose.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in response to valid legal requests.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, user data may be transferred.</li>
            </ul>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              4. Data Security
            </h2>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              5. Data Retention
            </h2>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. You may request deletion of your account and associated data at any time.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              6. Your Rights
            </h2>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-neutral-700 dark:text-neutral-300 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Objection:</strong> Object to processing of your personal data</li>
              <li><strong>Restriction:</strong> Request restriction of processing your personal data</li>
              <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
            </ul>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mt-4">
              To exercise these rights, please contact us at support@voicedraft.app
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              7. Children&apos;s Privacy
            </h2>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              VoiceDraft is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will delete such information.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              8. International Data Transfers
            </h2>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              9. Changes to This Privacy Policy
            </h2>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically.
            </p>

            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-8 mb-4">
              10. Contact Us
            </h2>

            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mt-2">
              <strong>Email:</strong> support@voicedraft.app<br />
              <strong>Website:</strong> https://voice-draft.vercel.app
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
