"use client";

import { useEffect, useState } from "react";

export default function ApiDocsPage() {
  const [swaggerHtml, setSwaggerHtml] = useState<string>("");

  useEffect(() => {
    // Generate Swagger UI HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Robot API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin:0;
      background: #fafafa;
    }
    .swagger-ui .topbar {
      background-color: #1f2937;
    }
    .swagger-ui .topbar .download-url-wrapper {
      display: none;
    }
    .custom-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;
    }
    .custom-header h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 300;
    }
    .custom-header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>🤖 Happy Robot API</h1>
    <p>Real-time Project Management & Task Tracking API</p>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api/docs',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        requestInterceptor: (req) => {
          // Add authentication header if available
          const token = localStorage.getItem('clerk-token');
          if (token) {
            req.headers.Authorization = \`Bearer \${token}\`;
          }
          return req;
        },
        onComplete: () => {
          console.log('Swagger UI loaded successfully');
        },
        onFailure: (error) => {
          console.error('Failed to load Swagger UI:', error);
        }
      });
      
      window.ui = ui;
    };
  </script>
</body>
</html>`;

    setSwaggerHtml(html);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🤖 Happy Robot API Documentation
            </h1>
            <p className="text-gray-600">
              Interactive API documentation for the Happy Robot project
              management system. This API provides real-time collaboration
              features through WebSocket connections.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <a
                href="/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                📋 OpenAPI Spec (JSON)
              </a>
              <a
                href="/websocket-server/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                🔌 WebSocket Server Docs
              </a>
              <a
                href="https://github.com/your-repo/happy-robot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                📚 GitHub Repository
              </a>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Authentication Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Most API endpoints require authentication using Clerk JWT
                      tokens. To test the API, you'll need to:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Log in to the application to get a valid token</li>
                      <li>
                        Copy the token from your browser's developer tools
                      </li>
                      <li>
                        Click the "Authorize" button in Swagger UI and paste
                        your token
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  🚀 Getting Started
                </h3>
                <p className="text-blue-800 text-sm">
                  Start by creating a project, then add tasks and collaborate in
                  real-time.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">
                  ⚡ Real-time Features
                </h3>
                <p className="text-green-800 text-sm">
                  WebSocket connections enable live collaboration on tasks and
                  comments.
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">
                  🔐 Authentication
                </h3>
                <p className="text-purple-800 text-sm">
                  Secure API access using Clerk JWT tokens for user
                  authentication.
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div
                className="w-full h-screen"
                dangerouslySetInnerHTML={{ __html: swaggerHtml }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
