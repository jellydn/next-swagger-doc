import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Next.js 14 Auto-Generate Example
            </h1>
            <p className="text-xl text-gray-600">
              Demonstrating{" "}
              <code className="bg-blue-100 px-3 py-1 rounded text-blue-800">
                next-swagger-doc
              </code>{" "}
              auto-generation feature
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              🚀 What's This?
            </h2>
            <p className="text-gray-600 mb-4">
              This example project showcases the powerful auto-generation
              feature of <strong>next-swagger-doc v0.4.0</strong>, which
              automatically generates OpenAPI documentation from your Next.js
              API routes with minimal or no JSDoc annotations.
            </p>

            <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">
                ✨ Key Benefits
              </h3>
              <ul className="list-disc list-inside text-green-800 space-y-1">
                <li>Reduce JSDoc boilerplate by 60%+</li>
                <li>Automatic path and method inference</li>
                <li>Schema extraction from TypeScript types and Zod schemas</li>
                <li>Three modes: Minimal JSDoc, Schema Inference, and Hybrid</li>
              </ul>
            </div>

            <Link
              href="/api-doc"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              View Auto-Generated API Documentation →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                📝 Minimal JSDoc Mode
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Write just a summary comment. Auto-generation handles paths,
                methods, and parameters.
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                GET /api/users
              </code>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                🔍 Schema Inference Mode
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Automatic schema extraction from TypeScript types and Zod
                schemas.
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                GET /api/users/&#123;id&#125;
              </code>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                🎨 Hybrid Mode
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Mix auto-generation with explicit JSDoc for full control over
                advanced features.
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block">
                GET /api/products
              </code>
            </div>
          </div>

          <div className="bg-gray-800 text-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">📚 Learn More</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/jellydn/next-swagger-doc"
                  className="text-blue-300 hover:text-blue-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  → GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="http://next-swagger-doc.productsway.com/"
                  className="text-blue-300 hover:text-blue-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  → Documentation
                </a>
              </li>
              <li>
                <Link href="/api-doc" className="text-blue-300 hover:text-blue-200">
                  → API Documentation
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
